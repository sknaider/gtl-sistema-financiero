"""Empresa model - Catálogo de clientes."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Empresa(Base):
    __tablename__ = "empresas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ingresos = relationship("Ingreso", back_populates="empresa")
    pagos = relationship("Pago", back_populates="empresa")
    
    def __repr__(self):
        return f"<Empresa {self.id}: {self.nombre}>"
