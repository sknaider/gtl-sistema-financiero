from api.dependencies import get_current_user
"""Ingresos API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.ingreso import IngresoCreate, IngresoUpdate, IngresoResponse
from services import ingreso_service

router = APIRouter(tags=["ingresos"])

@router.post("/", response_model=IngresoResponse, status_code=201)
def crear_ingreso(ingreso: IngresoCreate, db: Session = Depends(get_db)):
    """Create new ingreso."""
    # Validar que tenga cliente_id O empresa_id
    if not ingreso.cliente_id and not ingreso.empresa_id:
        raise HTTPException(
            status_code=400,
            detail="El ingreso debe tener un cliente_id o empresa_id"
        )
    
    return ingreso_service.create_ingreso(db, ingreso)

@router.get("/", response_model=List[IngresoResponse])
def listar_ingresos(
    skip: int = 0,
    limit: int = 100,
    mes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List ingresos with filters."""
    return ingreso_service.get_ingresos(db, skip, limit, mes)

@router.get("/{ingreso_id}", response_model=IngresoResponse)
def obtener_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Get single ingreso."""
    ingreso = ingreso_service.get_ingreso(db, ingreso_id)
    if not ingreso:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return ingreso

@router.put("/{ingreso_id}", response_model=IngresoResponse)
def actualizar_ingreso(
    ingreso_id: int,
    ingreso: IngresoUpdate,
    db: Session = Depends(get_db)
):
    """Update ingreso."""
    updated = ingreso_service.update_ingreso(db, ingreso_id, ingreso)
    if not updated:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return updated

@router.delete("/{ingreso_id}", status_code=204)
def eliminar_ingreso(ingreso_id: int, db: Session = Depends(get_db)):
    """Delete ingreso."""
    deleted = ingreso_service.delete_ingreso(db, ingreso_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado")
    return None

@router.get("/mes/{mes}/kpis")
def kpis_mes(mes: str, db: Session = Depends(get_db)):
    """Get KPIs for specific month."""
    return ingreso_service.get_kpis_mes(db, mes)

@router.get("/analisis/por-mes")
def analisis_mensual(db: Session = Depends(get_db)):
    """Group ingresos by month."""
    return ingreso_service.analizar_por_mes(db)
