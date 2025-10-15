from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime

class ActionType(str, Enum):
    """Tipos de acciones que JARVIS puede ejecutar"""
    # Lectura (sin confirmación)
    READ_ONLY = "read_only"
    
    # Actualizaciones (con confirmación)
    UPDATE_PAGO = "update_pago"
    UPDATE_MONTO = "update_monto"
    UPDATE_DESCRIPCION = "update_descripcion"
    
    # Creaciones (con confirmación)
    CREATE_INGRESO = "create_ingreso"
    CREATE_COSTO = "create_costo"
    
    # Eliminaciones (doble confirmación)
    DELETE_INGRESO = "delete_ingreso"
    DELETE_COSTO = "delete_costo"
    DELETE_PAGO = "delete_pago"


class ActionProposal(BaseModel):
    """Propuesta de acción generada por JARVIS"""
    action_id: str = Field(..., description="ID único de la acción")
    action_type: ActionType = Field(..., description="Tipo de acción")
    entity_type: str = Field(..., description="Tipo de entidad (ingreso, costo, pago)")
    entity_id: Optional[int] = Field(None, description="ID de la entidad (si existe)")
    
    # Estados
    current_state: Optional[Dict[str, Any]] = Field(None, description="Estado actual")
    proposed_state: Dict[str, Any] = Field(..., description="Estado propuesto")
    
    # Metadata
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confianza de Claude (0-1)")
    explanation: str = Field(..., description="Explicación en lenguaje natural")
    warnings: Optional[List[str]] = Field(default=[], description="Advertencias al usuario")
    
    # Datos adicionales para crear
    additional_data: Optional[Dict[str, Any]] = Field(None, description="Datos extras para creación")
    
    # Validaciones
    requires_confirmation: bool = Field(True, description="¿Requiere confirmación?")
    requires_double_confirmation: bool = Field(False, description="¿Requiere doble confirmación?")
    confirmation_text: Optional[str] = Field(None, description="Texto que usuario debe escribir")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_id": "act_abc123xyz",
                "action_type": "update_pago",
                "entity_type": "pago",
                "entity_id": 42,
                "current_state": {"estado": "NO PAGADO", "fecha_pago": None},
                "proposed_state": {"estado": "PAGADO", "fecha_pago": "2025-10-15"},
                "confidence": 0.98,
                "explanation": "Cambiar estado de pago de NO PAGADO a PAGADO para AWB 074-7014-2284",
                "warnings": [],
                "requires_confirmation": True,
                "requires_double_confirmation": False
            }
        }


class ActionConfirmation(BaseModel):
    """Confirmación del usuario para ejecutar la acción"""
    action_id: str = Field(..., description="ID de la acción a confirmar")
    confirmed: bool = Field(..., description="¿Usuario confirma?")
    confirmation_text: Optional[str] = Field(None, description="Texto escrito por usuario (para doble confirmación)")
    ip_address: Optional[str] = Field(None, description="IP del usuario")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_id": "act_abc123xyz",
                "confirmed": True,
                "confirmation_text": None,
                "ip_address": "192.168.1.100"
            }
        }


class ActionResult(BaseModel):
    """Resultado de la ejecución de una acción"""
    action_id: str = Field(..., description="ID de la acción ejecutada")
    success: bool = Field(..., description="¿Se ejecutó exitosamente?")
    entity_type: str = Field(..., description="Tipo de entidad")
    entity_id: Optional[int] = Field(None, description="ID de la entidad afectada")
    
    # Resultados
    old_value: Optional[Dict[str, Any]] = Field(None, description="Valor anterior")
    new_value: Optional[Dict[str, Any]] = Field(None, description="Valor nuevo")
    
    # Metadata
    message: str = Field(..., description="Mensaje al usuario")
    executed_at: datetime = Field(default_factory=datetime.now, description="Timestamp de ejecución")
    audit_log_id: Optional[int] = Field(None, description="ID del registro en audit_log")
    
    # Efectos secundarios
    side_effects: Optional[List[str]] = Field(default=[], description="Efectos en otros registros")
    
    # Errores
    error_message: Optional[str] = Field(None, description="Mensaje de error si falló")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_id": "act_abc123xyz",
                "success": True,
                "entity_type": "pago",
                "entity_id": 42,
                "old_value": {"estado": "NO PAGADO"},
                "new_value": {"estado": "PAGADO", "fecha_pago": "2025-10-15"},
                "message": "✅ Estado actualizado exitosamente",
                "executed_at": "2025-10-15T14:35:20",
                "audit_log_id": 123,
                "side_effects": ["Cuenta por cobrar cerrada"],
                "error_message": None
            }
        }


class ThresholdConfig(BaseModel):
    """Configuración de umbrales de aprobación"""
    max_amount_pen: Optional[float] = Field(None, description="Monto máximo en PEN")
    max_amount_usd: Optional[float] = Field(None, description="Monto máximo en USD")
    max_change_percent: Optional[float] = Field(None, description="% máximo de cambio")
    requires_manager_approval: bool = Field(False, description="¿Requiere aprobación gerencial?")
    
    class Config:
        json_schema_extra = {
            "example": {
                "max_amount_pen": 10000.0,
                "max_amount_usd": 3000.0,
                "max_change_percent": 10.0,
                "requires_manager_approval": False
            }
        }
