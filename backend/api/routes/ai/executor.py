from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any
import logging
import uuid

from core.database import get_db
from schemas.actions import (
    ActionProposal, 
    ActionConfirmation, 
    ActionResult,
    ActionType
)
from services.action_validator import action_validator
from services.action_executor import action_executor

logger = logging.getLogger(__name__)

router = APIRouter()

# Almacenamiento temporal de acciones pendientes
# En producción, usar Redis o base de datos
pending_actions: Dict[str, ActionProposal] = {}


@router.post("/propose", response_model=Dict[str, Any])
async def propose_action(
    proposal: ActionProposal,
    db: Session = Depends(get_db)
):
    """
    Valida y almacena una propuesta de acción.
    Retorna información de validación para mostrar al usuario.
    
    Este endpoint es llamado por JARVIS después de analizar
    la intención del usuario.
    """
    try:
        # Validar la propuesta
        validation_result = action_validator.validate_action(proposal)
        
        if not validation_result["is_valid"]:
            return {
                "status": "invalid",
                "errors": validation_result["errors"],
                "proposal": None
            }
        
        # Almacenar propuesta pendiente
        pending_actions[proposal.action_id] = proposal
        
        # Actualizar propuesta con resultados de validación
        proposal.requires_confirmation = validation_result["requires_confirmation"]
        proposal.requires_double_confirmation = validation_result["requires_double_confirmation"]
        
        if validation_result.get("confirmation_text"):
            proposal.confirmation_text = validation_result["confirmation_text"]
        
        # Agregar warnings de validación
        if validation_result.get("warnings"):
            proposal.warnings.extend(validation_result["warnings"])
        
        return {
            "status": "pending_confirmation",
            "proposal": proposal.dict(),
            "validation": validation_result
        }
        
    except Exception as e:
        logger.error(f"Error en propose_action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute", response_model=ActionResult)
async def execute_action(
    confirmation: ActionConfirmation,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Ejecuta una acción previamente propuesta y confirmada por el usuario.
    
    Flow:
    1. Usuario pregunta algo a JARVIS
    2. JARVIS detecta necesidad de modificar datos
    3. JARVIS llama a /propose con ActionProposal
    4. Frontend muestra confirmación al usuario
    5. Usuario confirma
    6. Frontend llama a /execute con ActionConfirmation
    7. Este endpoint ejecuta la acción en BD
    """
    try:
        # Verificar que la acción existe
        proposal = pending_actions.get(confirmation.action_id)
        
        if not proposal:
            raise HTTPException(
                status_code=404,
                detail=f"Acción {confirmation.action_id} no encontrada o expiró"
            )
        
        # Verificar confirmación
        if not confirmation.confirmed:
            # Usuario canceló
            del pending_actions[confirmation.action_id]
            return ActionResult(
                action_id=confirmation.action_id,
                success=False,
                entity_type=proposal.entity_type,
                entity_id=proposal.entity_id,
                message="❌ Acción cancelada por el usuario"
            )
        
        # Validar doble confirmación si es necesario
        if proposal.requires_double_confirmation:
            if not confirmation.confirmation_text:
                raise HTTPException(
                    status_code=400,
                    detail="Esta acción requiere texto de confirmación"
                )
            
            expected_text = proposal.confirmation_text or "CONFIRMAR ELIMINACIÓN"
            if confirmation.confirmation_text != expected_text:
                raise HTTPException(
                    status_code=400,
                    detail=f"Texto de confirmación incorrecto. Se esperaba: '{expected_text}'"
                )
        
        # Obtener IP del cliente
        ip_address = confirmation.ip_address or request.client.host
        
        # Ejecutar acción
        result = action_executor.execute_action(
            proposal=proposal,
            confirmation_ip=ip_address,
            db=db
        )
        
        # Limpiar acción pendiente
        if result.success:
            del pending_actions[confirmation.action_id]
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ejecutando acción {confirmation.action_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pending/{action_id}", response_model=Dict[str, Any])
async def get_pending_action(action_id: str):
    """
    Obtiene información de una acción pendiente.
    Útil para debug o para mostrar detalles antes de confirmar.
    """
    proposal = pending_actions.get(action_id)
    
    if not proposal:
        raise HTTPException(
            status_code=404,
            detail=f"Acción {action_id} no encontrada"
        )
    
    return {
        "action_id": action_id,
        "proposal": proposal.dict(),
        "status": "pending"
    }


@router.delete("/pending/{action_id}")
async def cancel_pending_action(action_id: str):
    """
    Cancela una acción pendiente.
    """
    if action_id not in pending_actions:
        raise HTTPException(
            status_code=404,
            detail=f"Acción {action_id} no encontrada"
        )
    
    del pending_actions[action_id]
    
    return {
        "status": "cancelled",
        "action_id": action_id,
        "message": "Acción cancelada exitosamente"
    }


@router.get("/pending")
async def list_pending_actions():
    """
    Lista todas las acciones pendientes.
    Útil para debug.
    """
    return {
        "total": len(pending_actions),
        "actions": [
            {
                "action_id": aid,
                "action_type": proposal.action_type,
                "entity_type": proposal.entity_type
            }
            for aid, proposal in pending_actions.items()
        ]
    }


@router.get("/health")
async def health_check():
    """Health check del servicio de ejecución"""
    return {
        "status": "healthy",
        "service": "action_executor",
        "pending_actions": len(pending_actions)
    }
