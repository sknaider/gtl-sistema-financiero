"""Pydantic schemas for Ingreso."""
from pydantic import BaseModel, field_validator, ValidationError, Field, validator
from datetime import date
from typing import Optional
from decimal import Decimal

class IngresoBase(BaseModel):
    fecha: date
    empresa_id: Optional[int] = None
    cliente_id: Optional[int] = None
    descripcion: Optional[str] = None
    awb: Optional[str] = None
    moneda: str = Field(default="PEN", pattern="^(USD|PEN)$")
    monto: Decimal = Field(gt=0)
    mes: str
    
    @validator('monto')
    def validar_monto(cls, v):
        if v <= 0:
            raise ValueError('Monto debe ser mayor a 0')
        return v

class IngresoCreate(IngresoBase):
    pass

class IngresoUpdate(BaseModel):
    fecha: Optional[date] = None
    empresa_id: Optional[int] = None
    cliente_id: Optional[int] = None
    descripcion: Optional[str] = None
    awb: Optional[str] = None
    moneda: Optional[str] = None
    monto: Optional[Decimal] = None
    mes: Optional[str] = None

class IngresoResponse(IngresoBase):
    id: int
    monto_pen: Optional[Decimal]
    numero: Optional[int]
    
    
    @field_validator('cliente_id', 'empresa_id')
    @classmethod
    def validate_cliente_o_empresa(cls, v, info):
        # Esta validación se ejecuta después, en el endpoint
        return v
    
    class Config:
        from_attributes = True
