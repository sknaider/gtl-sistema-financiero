from typing import Dict, Any, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from schemas.actions import ActionProposal, ActionResult, ActionType
from models.ingreso import Ingreso
from models.costo import Costo
from models.pago import Pago
from models.audit_log import AuditLog

logger = logging.getLogger(__name__)

class ActionExecutor:
    """
    Ejecuta acciones CRUD confirmadas por el usuario en la base de datos.
    Incluye registro de auditoría y recalculo de utilidades.
    """
    
    def __init__(self):
        pass
    
    def execute_action(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """
        Ejecuta una acción confirmada.
        
        Args:
            proposal: Propuesta de acción validada
            confirmation_ip: IP del usuario que confirmó
            db: Sesión de base de datos
            
        Returns:
            ActionResult con el resultado de la ejecución
        """
        try:
            # Ejecutar según tipo de acción
            if proposal.action_type == ActionType.CREATE_INGRESO:
                return self._execute_create_ingreso(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.CREATE_COSTO:
                return self._execute_create_costo(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.UPDATE_PAGO:
                return self._execute_update_pago(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.UPDATE_MONTO:
                return self._execute_update_monto(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.UPDATE_DESCRIPCION:
                return self._execute_update_descripcion(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.DELETE_INGRESO:
                return self._execute_delete_ingreso(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.DELETE_COSTO:
                return self._execute_delete_costo(proposal, confirmation_ip, db)
            
            elif proposal.action_type == ActionType.DELETE_PAGO:
                return self._execute_delete_pago(proposal, confirmation_ip, db)
            
            else:
                raise ValueError(f"Tipo de acción no soportado: {proposal.action_type}")
                
        except Exception as e:
            logger.error(f"Error ejecutando acción {proposal.action_id}: {str(e)}")
            db.rollback()
            
            # Registrar fallo en audit_log
            self._log_failed_action(proposal, confirmation_ip, str(e), db)
            
            return ActionResult(
                action_id=proposal.action_id,
                success=False,
                entity_type=proposal.entity_type,
                entity_id=proposal.entity_id,
                message=f"❌ Error ejecutando acción: {str(e)}",
                error_message=str(e)
            )
    
    def _execute_create_ingreso(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Crea un nuevo ingreso"""
        try:
            # Extraer datos
            data = proposal.proposed_state
            
            # Crear registro
            nuevo_ingreso = Ingreso(
                fecha=datetime.strptime(data["fecha"], "%Y-%m-%d").date() if isinstance(data["fecha"], str) else data["fecha"],
                empresa_id=data.get("empresa_id") or data.get("cliente"),
                descripcion=data.get("descripcion"),
                awb=data.get("awb"),
                moneda=data["moneda"],
                monto=data["monto"],
                monto_pen=data.get("monto_pen") or (data["monto"] if data["moneda"] == "PEN" else data["monto"] * 3.42),
                mes=data["mes"],
                numero=self._get_next_numero(db, "ingresos", data["mes"])
            )
            
            db.add(nuevo_ingreso)
            db.flush()  # Para obtener el ID sin hacer commit
            
            # Registrar en audit_log
            audit_id = self._log_action(
                action_type="create",
                entity_type="ingreso",
                entity_id=nuevo_ingreso.id,
                old_value=None,
                new_value=data,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            # Recalcular utilidades del mes
            self._recalcular_utilidades(data["mes"], db)
            
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="ingreso",
                entity_id=nuevo_ingreso.id,
                old_value=None,
                new_value=data,
                message=f"✅ Ingreso creado exitosamente (ID: #{nuevo_ingreso.id})",
                audit_log_id=audit_id,
                side_effects=[
                    f"AWB asignado: {nuevo_ingreso.awb}",
                    f"Utilidad de {data['mes']} recalculada"
                ]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_create_costo(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Crea un nuevo costo"""
        try:
            data = proposal.proposed_state
            
            nuevo_costo = Costo(
                fecha=datetime.strptime(data["fecha"], "%Y-%m-%d").date() if isinstance(data["fecha"], str) else data["fecha"],
                concepto=data["concepto"],
                monto=data["monto"],
                tipo=data.get("tipo"),
                mes=data["mes"],
                numero=self._get_next_numero(db, "costos", data["mes"])
            )
            
            db.add(nuevo_costo)
            db.flush()
            
            audit_id = self._log_action(
                action_type="create",
                entity_type="costo",
                entity_id=nuevo_costo.id,
                old_value=None,
                new_value=data,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            self._recalcular_utilidades(data["mes"], db)
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="costo",
                entity_id=nuevo_costo.id,
                old_value=None,
                new_value=data,
                message=f"✅ Costo creado exitosamente (ID: #{nuevo_costo.id})",
                audit_log_id=audit_id,
                side_effects=[f"Utilidad de {data['mes']} recalculada"]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_update_pago(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Actualiza estado de un pago"""
        try:
            pago = db.query(Pago).filter(Pago.id == proposal.entity_id).first()
            
            if not pago:
                raise ValueError(f"Pago #{proposal.entity_id} no encontrado")
            
            # Guardar estado anterior
            old_value = {
                "estado": pago.estado,
                "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None
            }
            
            # Aplicar cambios
            nuevo_estado = proposal.proposed_state.get("estado")
            if nuevo_estado:
                pago.estado = nuevo_estado
                if nuevo_estado == "PAGADO":
                    pago.fecha_pago = date.today()
                else:
                    pago.fecha_pago = None
            
            pago.updated_at = datetime.now()
            
            audit_id = self._log_action(
                action_type="update",
                entity_type="pago",
                entity_id=pago.id,
                old_value=old_value,
                new_value=proposal.proposed_state,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="pago",
                entity_id=pago.id,
                old_value=old_value,
                new_value={"estado": pago.estado, "fecha_pago": pago.fecha_pago.isoformat() if pago.fecha_pago else None},
                message=f"✅ Estado actualizado: {old_value['estado']} → {pago.estado}",
                audit_log_id=audit_id,
                side_effects=["Cuenta por cobrar actualizada"]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_update_monto(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Actualiza monto de ingreso o costo"""
        try:
            entity_type = proposal.entity_type
            entity_id = proposal.entity_id
            
            if entity_type == "ingreso":
                entity = db.query(Ingreso).filter(Ingreso.id == entity_id).first()
            elif entity_type == "costo":
                entity = db.query(Costo).filter(Costo.id == entity_id).first()
            else:
                raise ValueError(f"Tipo de entidad no válido: {entity_type}")
            
            if not entity:
                raise ValueError(f"{entity_type.capitalize()} #{entity_id} no encontrado")
            
            old_value = {"monto": float(entity.monto)}
            new_monto = proposal.proposed_state["monto"]
            
            entity.monto = new_monto
            if hasattr(entity, 'monto_pen') and hasattr(entity, 'moneda'):
                if entity.moneda == "PEN":
                    entity.monto_pen = new_monto
                else:
                    entity.monto_pen = new_monto * 3.42  # Tipo de cambio
            
            audit_id = self._log_action(
                action_type="update",
                entity_type=entity_type,
                entity_id=entity_id,
                old_value=old_value,
                new_value={"monto": new_monto},
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            # Recalcular utilidades
            mes = entity.mes
            self._recalcular_utilidades(mes, db)
            
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type=entity_type,
                entity_id=entity_id,
                old_value=old_value,
                new_value={"monto": new_monto},
                message=f"✅ Monto actualizado: S/ {old_value['monto']:,.2f} → S/ {new_monto:,.2f}",
                audit_log_id=audit_id,
                side_effects=[f"Utilidad de {mes} recalculada"]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_update_descripcion(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Actualiza descripción de ingreso o costo"""
        try:
            entity_type = proposal.entity_type
            entity_id = proposal.entity_id
            
            if entity_type == "ingreso":
                entity = db.query(Ingreso).filter(Ingreso.id == entity_id).first()
            elif entity_type == "costo":
                entity = db.query(Costo).filter(Costo.id == entity_id).first()
            else:
                raise ValueError(f"Tipo de entidad no válido: {entity_type}")
            
            if not entity:
                raise ValueError(f"{entity_type.capitalize()} #{entity_id} no encontrado")
            
            old_value = {"descripcion": entity.descripcion if entity_type == "ingreso" else entity.concepto}
            new_descripcion = proposal.proposed_state["descripcion"]
            
            if entity_type == "ingreso":
                entity.descripcion = new_descripcion
            else:
                entity.concepto = new_descripcion
            
            audit_id = self._log_action(
                action_type="update",
                entity_type=entity_type,
                entity_id=entity_id,
                old_value=old_value,
                new_value={"descripcion": new_descripcion},
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type=entity_type,
                entity_id=entity_id,
                old_value=old_value,
                new_value={"descripcion": new_descripcion},
                message="✅ Descripción actualizada exitosamente",
                audit_log_id=audit_id
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_delete_ingreso(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Elimina un ingreso"""
        try:
            ingreso = db.query(Ingreso).filter(Ingreso.id == proposal.entity_id).first()
            
            if not ingreso:
                raise ValueError(f"Ingreso #{proposal.entity_id} no encontrado")
            
            old_value = {
                "id": ingreso.id,
                "fecha": ingreso.fecha.isoformat(),
                "monto": float(ingreso.monto),
                "mes": ingreso.mes
            }
            
            mes = ingreso.mes
            
            audit_id = self._log_action(
                action_type="delete",
                entity_type="ingreso",
                entity_id=ingreso.id,
                old_value=old_value,
                new_value=None,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            db.delete(ingreso)
            self._recalcular_utilidades(mes, db)
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="ingreso",
                entity_id=proposal.entity_id,
                old_value=old_value,
                new_value=None,
                message=f"✅ Ingreso #{proposal.entity_id} eliminado permanentemente",
                audit_log_id=audit_id,
                side_effects=[
                    f"Utilidad de {mes} recalculada",
                    "Backup automático creado en audit_log"
                ]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_delete_costo(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Elimina un costo"""
        try:
            costo = db.query(Costo).filter(Costo.id == proposal.entity_id).first()
            
            if not costo:
                raise ValueError(f"Costo #{proposal.entity_id} no encontrado")
            
            old_value = {
                "id": costo.id,
                "fecha": costo.fecha.isoformat(),
                "monto": float(costo.monto),
                "mes": costo.mes
            }
            
            mes = costo.mes
            
            audit_id = self._log_action(
                action_type="delete",
                entity_type="costo",
                entity_id=costo.id,
                old_value=old_value,
                new_value=None,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            db.delete(costo)
            self._recalcular_utilidades(mes, db)
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="costo",
                entity_id=proposal.entity_id,
                old_value=old_value,
                new_value=None,
                message=f"✅ Costo #{proposal.entity_id} eliminado permanentemente",
                audit_log_id=audit_id,
                side_effects=[f"Utilidad de {mes} recalculada"]
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _execute_delete_pago(
        self, 
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        db: Session
    ) -> ActionResult:
        """Elimina un pago"""
        try:
            pago = db.query(Pago).filter(Pago.id == proposal.entity_id).first()
            
            if not pago:
                raise ValueError(f"Pago #{proposal.entity_id} no encontrado")
            
            old_value = {
                "id": pago.id,
                "awb": pago.awb,
                "estado": pago.estado
            }
            
            audit_id = self._log_action(
                action_type="delete",
                entity_type="pago",
                entity_id=pago.id,
                old_value=old_value,
                new_value=None,
                ai_confidence=proposal.confidence,
                confirmation_ip=confirmation_ip,
                db=db
            )
            
            db.delete(pago)
            db.commit()
            
            return ActionResult(
                action_id=proposal.action_id,
                success=True,
                entity_type="pago",
                entity_id=proposal.entity_id,
                old_value=old_value,
                new_value=None,
                message=f"✅ Pago #{proposal.entity_id} eliminado permanentemente",
                audit_log_id=audit_id
            )
            
        except Exception as e:
            db.rollback()
            raise e
    
    def _log_action(
        self,
        action_type: str,
        entity_type: str,
        entity_id: int,
        old_value: Optional[Dict],
        new_value: Optional[Dict],
        ai_confidence: float,
        confirmation_ip: Optional[str],
        db: Session
    ) -> int:
        """Registra la acción en audit_log"""
        audit_log = AuditLog(
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ai_confidence=ai_confidence,
            user_confirmation=True,
            ip_address=confirmation_ip,
            success=True
        )
        
        db.add(audit_log)
        db.flush()
        
        return audit_log.id
    
    def _log_failed_action(
        self,
        proposal: ActionProposal,
        confirmation_ip: Optional[str],
        error_message: str,
        db: Session
    ):
        """Registra una acción fallida en audit_log"""
        try:
            audit_log = AuditLog(
                action_type=proposal.action_type.value,
                entity_type=proposal.entity_type,
                entity_id=proposal.entity_id or 0,
                old_value=proposal.current_state,
                new_value=proposal.proposed_state,
                ai_confidence=proposal.confidence,
                user_confirmation=True,
                ip_address=confirmation_ip,
                success=False,
                error_message=error_message
            )
            
            db.add(audit_log)
            db.commit()
        except Exception as e:
            logger.error(f"Error registrando fallo en audit_log: {str(e)}")
    
    def _get_next_numero(self, db: Session, tabla: str, mes: str) -> int:
        """Obtiene el próximo número de transacción para el mes"""
        result = db.execute(
            text(f"SELECT COALESCE(MAX(numero), 0) + 1 as next_num FROM {tabla} WHERE mes = :mes"),
            {"mes": mes}
        ).fetchone()
        return result[0] if result else 1
    
    def _recalcular_utilidades(self, mes: str, db: Session):
        """Recalcula las utilidades de un mes específico"""
        try:
            # Llamar al endpoint de recalcular utilidades
            # (Esto ya existe en tu sistema)
            db.execute(
                text("""
                    INSERT INTO utilidades (mes, total_ingresos, total_costos, utilidad_neta, margen)
                    SELECT 
                        :mes,
                        COALESCE((SELECT SUM(monto_pen) FROM ingresos WHERE mes = :mes), 0),
                        COALESCE((SELECT SUM(monto) FROM costos WHERE mes = :mes), 0),
                        COALESCE((SELECT SUM(monto_pen) FROM ingresos WHERE mes = :mes), 0) - 
                        COALESCE((SELECT SUM(monto) FROM costos WHERE mes = :mes), 0),
                        CASE 
                            WHEN COALESCE((SELECT SUM(monto_pen) FROM ingresos WHERE mes = :mes), 0) > 0
                            THEN ((COALESCE((SELECT SUM(monto_pen) FROM ingresos WHERE mes = :mes), 0) - 
                                   COALESCE((SELECT SUM(monto) FROM costos WHERE mes = :mes), 0)) / 
                                  COALESCE((SELECT SUM(monto_pen) FROM ingresos WHERE mes = :mes), 0) * 100)
                            ELSE 0
                        END
                    ON CONFLICT (mes) DO UPDATE SET
                        total_ingresos = EXCLUDED.total_ingresos,
                        total_costos = EXCLUDED.total_costos,
                        utilidad_neta = EXCLUDED.utilidad_neta,
                        margen = EXCLUDED.margen,
                        updated_at = NOW()
                """),
                {"mes": mes}
            )
            db.flush()
        except Exception as e:
            logger.error(f"Error recalculando utilidades para {mes}: {str(e)}")
            raise e


# Instancia global del executor
action_executor = ActionExecutor()
