"""TipoCosto model."""
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from datetime import datetime
from core.database import Base

class TipoCosto(Base):
    __tablename__ = "tipos_costo"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<TipoCosto {self.id}: {self.nombre}>"
