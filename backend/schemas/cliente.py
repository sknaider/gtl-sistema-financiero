"""Cliente schemas."""
from pydantic import BaseModel, ConfigDict
from typing import Optional, Union
from datetime import datetime

class ClienteBase(BaseModel):
    nombre: str
    dni: Union[str, None] = None
    telefono: Union[str, None] = None
    email: Union[str, None] = None
    color: Union[str, None] = "#3B82F6"

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Union[str, None] = None
    dni: Union[str, None] = None
    telefono: Union[str, None] = None
    email: Union[str, None] = None
    color: Union[str, None] = None

class ClienteResponse(ClienteBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
