"""TiposCosto API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from schemas.tipo_costo import TipoCostoCreate, TipoCostoUpdate, TipoCostoResponse
from services import tipo_costo_service

router = APIRouter(tags=["tipos_costo"])

@router.get("/", response_model=List[TipoCostoResponse])
def listar_tipos(
    incluir_inactivos: bool = False,
    db: Session = Depends(get_db)
):
    """List all tipos de costo."""
    return tipo_costo_service.get_all(db, incluir_inactivos)

@router.post("/", response_model=TipoCostoResponse, status_code=201)
def crear_tipo(tipo: TipoCostoCreate, db: Session = Depends(get_db)):
    """Create new tipo."""
    return tipo_costo_service.create(db, tipo)

@router.put("/{tipo_id}", response_model=TipoCostoResponse)
def actualizar_tipo(
    tipo_id: int,
    tipo: TipoCostoUpdate,
    db: Session = Depends(get_db)
):
    """Update tipo."""
    updated = tipo_costo_service.update(db, tipo_id, tipo)
    if not updated:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
    return updated

@router.delete("/{tipo_id}", status_code=204)
def eliminar_tipo(tipo_id: int, db: Session = Depends(get_db)):
    """Delete (deactivate) tipo."""
    deleted = tipo_costo_service.delete(db, tipo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tipo no encontrado")
