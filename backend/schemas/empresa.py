from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EmpresaBase(BaseModel):
    nombre: str

class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    nombre: Optional[str] = None

class EmpresaResponse(EmpresaBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
