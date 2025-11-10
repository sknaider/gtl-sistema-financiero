from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from models.cliente import Cliente
from pydantic import BaseModel

router = APIRouter()

class ClienteCreate(BaseModel):
    nombre: str
    dni: str = None
    telefono: str = None
    email: str = None
    color: str = '#3B82F6'

class ClienteResponse(BaseModel):
    id: int
    nombre: str
    dni: str = None
    telefono: str = None
    email: str = None
    color: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[ClienteResponse])
def obtener_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    nuevo = Cliente(**cliente.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(
    cliente_id: int,
    cliente: ClienteCreate,
    db: Session = Depends(get_db)
):
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(404, "Cliente no encontrado")
    
    for key, value in cliente.dict().items():
        setattr(db_cliente, key, value)
    
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(404, "Cliente no encontrado")
    
    db.delete(db_cliente)
    db.commit()
    return {"success": True, "id": cliente_id}
