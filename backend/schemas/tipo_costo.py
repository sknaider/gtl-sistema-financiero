"""Pydantic schemas for TipoCosto."""
from pydantic import BaseModel
from typing import Optional

class TipoCostoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: bool = True

class TipoCostoCreate(TipoCostoBase):
    pass

class TipoCostoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None

class TipoCostoResponse(TipoCostoBase):
    id: int
    
    class Config:
        from_attributes = True
