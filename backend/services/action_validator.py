from typing import Dict, Any, List
from schemas.actions import ActionProposal, ActionType, ThresholdConfig
from fastapi import HTTPException

class ActionValidator:
    """
    Valida si una acción propuesta cumple con los umbrales de seguridad
    y determina el nivel de confirmación requerido.
    """
    
    # Configuración de umbrales por tipo de acción
    THRESHOLDS = {
        ActionType.CREATE_INGRESO: ThresholdConfig(
            max_amount_pen=10000.0,
            max_amount_usd=3000.0,
            requires_manager_approval=False
        ),
        ActionType.CREATE_COSTO: ThresholdConfig(
            max_amount_pen=5000.0,
            max_amount_usd=1500.0,
            requires_manager_approval=False
        ),
        ActionType.UPDATE_MONTO: ThresholdConfig(
            max_change_percent=10.0,
            requires_manager_approval=False
        ),
        ActionType.UPDATE_PAGO: ThresholdConfig(
            requires_manager_approval=False
        ),
        ActionType.UPDATE_DESCRIPCION: ThresholdConfig(
            requires_manager_approval=False
        ),
        ActionType.DELETE_INGRESO: ThresholdConfig(
            requires_manager_approval=True  # Siempre requiere aprobación especial
        ),
        ActionType.DELETE_COSTO: ThresholdConfig(
            requires_manager_approval=True
        ),
        ActionType.DELETE_PAGO: ThresholdConfig(
            requires_manager_approval=True
        ),
    }
    
    # Límites absolutos (hard limits)
    ABSOLUTE_LIMITS = {
        "max_ingreso_pen": 50000.0,
        "max_ingreso_usd": 15000.0,
        "max_costo_pen": 20000.0,
        "max_costo_usd": 6000.0,
        "max_change_percent": 50.0,
    }
    
    def __init__(self):
        pass
    
    def validate_action(self, proposal: ActionProposal) -> Dict[str, Any]:
        """
        Valida una propuesta de acción y retorna información de validación.
        
        Returns:
            Dict con:
            - is_valid: bool
            - requires_confirmation: bool
            - requires_double_confirmation: bool
            - requires_manager_approval: bool
            - warnings: List[str]
            - errors: List[str]
        """
        result = {
            "is_valid": True,
            "requires_confirmation": True,
            "requires_double_confirmation": False,
            "requires_manager_approval": False,
            "confirmation_text": None,
            "warnings": [],
            "errors": []
        }
        
        # Validar según tipo de acción
        if proposal.action_type == ActionType.READ_ONLY:
            result["requires_confirmation"] = False
            return result
        
        elif proposal.action_type == ActionType.CREATE_INGRESO:
            return self._validate_create_ingreso(proposal, result)
        
        elif proposal.action_type == ActionType.CREATE_COSTO:
            return self._validate_create_costo(proposal, result)
        
        elif proposal.action_type == ActionType.UPDATE_MONTO:
            return self._validate_update_monto(proposal, result)
        
        elif proposal.action_type == ActionType.UPDATE_PAGO:
            return self._validate_update_pago(proposal, result)
        
        elif proposal.action_type == ActionType.UPDATE_DESCRIPCION:
            return self._validate_update_descripcion(proposal, result)
        
        elif proposal.action_type in [
            ActionType.DELETE_INGRESO,
            ActionType.DELETE_COSTO,
            ActionType.DELETE_PAGO
        ]:
            return self._validate_delete(proposal, result)
        
        return result
    
    def _validate_create_ingreso(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida creación de ingreso"""
        monto = proposal.proposed_state.get("monto", 0)
        moneda = proposal.proposed_state.get("moneda", "PEN")
        
        threshold = self.THRESHOLDS[ActionType.CREATE_INGRESO]
        
        if moneda == "PEN":
            limit = threshold.max_amount_pen
            absolute_limit = self.ABSOLUTE_LIMITS["max_ingreso_pen"]
        else:  # USD
            limit = threshold.max_amount_usd
            absolute_limit = self.ABSOLUTE_LIMITS["max_ingreso_usd"]
        
        # Validar límite absoluto
        if monto > absolute_limit:
            result["is_valid"] = False
            result["errors"].append(
                f"❌ Monto de {moneda} {monto:,.2f} excede el límite máximo permitido "
                f"de {moneda} {absolute_limit:,.2f}"
            )
            return result
        
        # Validar si requiere aprobación gerencial
        if monto > limit:
            result["requires_manager_approval"] = True
            result["warnings"].append(
                f"⚠️ Monto de {moneda} {monto:,.2f} requiere aprobación gerencial "
                f"(límite normal: {moneda} {limit:,.2f})"
            )
        
        # Validar campos requeridos
        required_fields = ["fecha", "cliente", "monto", "moneda", "mes"]
        missing_fields = [
            field for field in required_fields 
            if field not in proposal.proposed_state or not proposal.proposed_state[field]
        ]
        
        if missing_fields:
            result["is_valid"] = False
            result["errors"].append(
                f"❌ Campos requeridos faltantes: {', '.join(missing_fields)}"
            )
        
        return result
    
    def _validate_create_costo(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida creación de costo"""
        monto = proposal.proposed_state.get("monto", 0)
        
        threshold = self.THRESHOLDS[ActionType.CREATE_COSTO]
        limit = threshold.max_amount_pen
        absolute_limit = self.ABSOLUTE_LIMITS["max_costo_pen"]
        
        # Validar límite absoluto
        if monto > absolute_limit:
            result["is_valid"] = False
            result["errors"].append(
                f"❌ Monto de S/ {monto:,.2f} excede el límite máximo permitido "
                f"de S/ {absolute_limit:,.2f}"
            )
            return result
        
        # Validar si requiere aprobación gerencial
        if monto > limit:
            result["requires_manager_approval"] = True
            result["warnings"].append(
                f"⚠️ Monto de S/ {monto:,.2f} requiere aprobación gerencial "
                f"(límite normal: S/ {limit:,.2f})"
            )
        
        # Validar campos requeridos
        required_fields = ["fecha", "concepto", "monto", "mes"]
        missing_fields = [
            field for field in required_fields 
            if field not in proposal.proposed_state or not proposal.proposed_state[field]
        ]
        
        if missing_fields:
            result["is_valid"] = False
            result["errors"].append(
                f"❌ Campos requeridos faltantes: {', '.join(missing_fields)}"
            )
        
        return result
    
    def _validate_update_monto(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida actualización de monto"""
        if not proposal.current_state:
            result["is_valid"] = False
            result["errors"].append("❌ No se puede validar cambio sin estado actual")
            return result
        
        old_monto = proposal.current_state.get("monto", 0)
        new_monto = proposal.proposed_state.get("monto", 0)
        
        if old_monto == 0:
            result["is_valid"] = False
            result["errors"].append("❌ Monto actual es 0, no se puede calcular cambio")
            return result
        
        # Calcular porcentaje de cambio
        change_percent = abs((new_monto - old_monto) / old_monto * 100)
        
        threshold = self.THRESHOLDS[ActionType.UPDATE_MONTO]
        limit = threshold.max_change_percent
        absolute_limit = self.ABSOLUTE_LIMITS["max_change_percent"]
        
        # Validar límite absoluto
        if change_percent > absolute_limit:
            result["is_valid"] = False
            result["errors"].append(
                f"❌ Cambio de {change_percent:.1f}% excede el límite máximo "
                f"permitido de {absolute_limit:.1f}%"
            )
            return result
        
        # Validar si requiere aprobación gerencial
        if change_percent > limit:
            result["requires_manager_approval"] = True
            result["warnings"].append(
                f"⚠️ Cambio de {change_percent:.1f}% requiere aprobación gerencial "
                f"(límite normal: {limit:.1f}%)"
            )
        
        # Agregar información del cambio
        result["warnings"].append(
            f"💰 Monto: S/ {old_monto:,.2f} → S/ {new_monto:,.2f} "
            f"({'+' if new_monto > old_monto else ''}{change_percent:.1f}%)"
        )
        
        return result
    
    def _validate_update_pago(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida actualización de estado de pago"""
        # Cambio de estado de pago siempre requiere confirmación simple
        result["requires_confirmation"] = True
        result["requires_double_confirmation"] = False
        
        # Validar transición de estados
        if proposal.current_state:
            old_estado = proposal.current_state.get("estado")
            new_estado = proposal.proposed_state.get("estado")
            
            # Solo permitir NO PAGADO → PAGADO
            if old_estado == "PAGADO" and new_estado == "NO PAGADO":
                result["warnings"].append(
                    "⚠️ Estás cambiando de PAGADO a NO PAGADO. "
                    "Asegúrate de que esto es correcto."
                )
        
        return result
    
    def _validate_update_descripcion(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida actualización de descripción"""
        # Actualizar descripción es operación simple
        result["requires_confirmation"] = True
        result["requires_double_confirmation"] = False
        return result
    
    def _validate_delete(
        self, 
        proposal: ActionProposal, 
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Valida eliminación de registro"""
        # Eliminaciones SIEMPRE requieren doble confirmación
        result["requires_confirmation"] = True
        result["requires_double_confirmation"] = True
        result["requires_manager_approval"] = True
        result["confirmation_text"] = "CONFIRMAR ELIMINACIÓN"
        
        result["warnings"].append(
            "⚠️ ADVERTENCIA: Esta acción NO se puede deshacer"
        )
        result["warnings"].append(
            "⚠️ Escribe 'CONFIRMAR ELIMINACIÓN' para continuar"
        )
        
        # Agregar información del registro a eliminar
        if proposal.current_state:
            monto = proposal.current_state.get("monto", 0)
            result["warnings"].append(
                f"💰 Registro a eliminar: {proposal.entity_type} #{proposal.entity_id} "
                f"(Monto: S/ {monto:,.2f})"
            )
        
        return result
    
    def check_confidence_threshold(self, confidence: float) -> bool:
        """
        Verifica si el nivel de confianza de Claude es suficiente.
        
        Args:
            confidence: Score de 0.0 a 1.0
            
        Returns:
            True si la confianza es suficiente, False si no
        """
        # Umbrales de confianza
        MIN_CONFIDENCE_AUTO = 0.95  # Ejecución automática (si aplica)
        MIN_CONFIDENCE_CONFIRM = 0.70  # Requiere confirmación
        
        if confidence >= MIN_CONFIDENCE_AUTO:
            return True
        elif confidence >= MIN_CONFIDENCE_CONFIRM:
            return True
        else:
            return False


# Instancia global del validador
action_validator = ActionValidator()
