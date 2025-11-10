"""Pydantic schemas for Costo."""
from pydantic import BaseModel, Field, validator
from datetime import date
from typing import Optional
from decimal import Decimal

class CostoBase(BaseModel):
    fecha: date
    concepto: str
    monto: Decimal = Field(gt=0)
    tipo: Optional[str] = None
    moneda: str = Field(default="PEN", pattern="^(USD|PEN)$")
    awb: Optional[str] = None
    mes: str
    
    @validator('monto')
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('Monto debe ser mayor a 0')
        return v

class CostoCreate(CostoBase):
    pass

class CostoUpdate(BaseModel):
    fecha: Optional[date] = None
    concepto: Optional[str] = None
    monto: Optional[Decimal] = None
    tipo: Optional[str] = None
    moneda: Optional[str] = None
    awb: Optional[str] = None
    mes: Optional[str] = None

class CostoResponse(CostoBase):
    id: int
    numero: Optional[int]
    
    class Config:
        from_attributes = True
