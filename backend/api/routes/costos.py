"""Costos API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from schemas.costo import CostoCreate, CostoUpdate, CostoResponse
from services import costo_service

router = APIRouter(tags=["costos"])

@router.post("/", response_model=CostoResponse, status_code=201)
def crear_costo(costo: CostoCreate, db: Session = Depends(get_db)):
    """Create new costo."""
    return costo_service.create_costo(db, costo)

@router.get("/", response_model=List[CostoResponse])
def listar_costos(
    skip: int = 0,
    limit: int = 100,
    mes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List costos with filters."""
    return costo_service.get_costos(db, skip, limit, mes)

@router.get("/{costo_id}", response_model=CostoResponse)
def obtener_costo(costo_id: int, db: Session = Depends(get_db)):
    """Get single costo."""
    costo = costo_service.get_costo(db, costo_id)
    if not costo:
        raise HTTPException(status_code=404, detail="Costo no encontrado")
    return costo

@router.put("/{costo_id}", response_model=CostoResponse)
def actualizar_costo(
    costo_id: int,
    costo: CostoUpdate,
    db: Session = Depends(get_db)
):
    """Update costo."""
    updated = costo_service.update_costo(db, costo_id, costo)
    if not updated:
        raise HTTPException(status_code=404, detail="Costo no encontrado")
    return updated

@router.delete("/{costo_id}", status_code=204)
def eliminar_costo(costo_id: int, db: Session = Depends(get_db)):
    """Delete costo."""
    deleted = costo_service.delete_costo(db, costo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Costo no encontrado")
    return None

@router.get("/mes/{mes}/kpis")
def kpis_mes(mes: str, db: Session = Depends(get_db)):
    """Get KPIs for specific month."""
    return costo_service.get_kpis_mes(db, mes)

@router.get("/analisis/por-mes")
def analisis_mensual(db: Session = Depends(get_db)):
    """Group costos by month."""
    return costo_service.analizar_por_mes(db)
