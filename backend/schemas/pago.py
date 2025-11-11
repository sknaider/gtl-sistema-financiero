"""Pago schemas."""
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class PagoBase(BaseModel):
    empresa_id: Optional[int] = None
    cliente_id: Optional[int] = None
    awb: str
    estado: str = "NO PAGADO"
    mes: str

class PagoCreate(PagoBase):
    pass

class PagoUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_pago: Optional[date] = None

class PagoResponse(PagoBase):
    id: int
    fecha_pago: Optional[date] = None
    fecha_ingreso: Optional[date] = None  # NUEVO
    updated_at: datetime
    nombre_empresa: str
    
    class Config:
        from_attributes = True

class PagoEstadisticas(BaseModel):
    total: int
    pagados: int
    pendientes: int
