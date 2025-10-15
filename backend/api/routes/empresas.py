from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.empresa import Empresa
from schemas.empresa import EmpresaCreate, EmpresaResponse

router = APIRouter()

@router.get("/", response_model=List[EmpresaResponse])
def get_empresas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener todas las empresas con paginación"""
    empresas = db.query(Empresa).offset(skip).limit(limit).all()
    return empresas

@router.get("/{empresa_id}", response_model=EmpresaResponse)
def get_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """Obtener una empresa por ID"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.post("/", response_model=EmpresaResponse, status_code=201)
def create_empresa(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    """Crear una nueva empresa"""
    # Verificar si ya existe
    existing = db.query(Empresa).filter(Empresa.nombre == empresa.nombre).first()
    if existing:
        raise HTTPException(status_code=400, detail="La empresa ya existe")
    
    db_empresa = Empresa(**empresa.dict())
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

@router.delete("/{empresa_id}")
def delete_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """Eliminar una empresa"""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    db.delete(empresa)
    db.commit()
    return {"message": "Empresa eliminada exitosamente"}
