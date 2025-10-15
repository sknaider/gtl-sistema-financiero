"""Costo model - Transacciones de costos."""
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime
from datetime import datetime
from core.database import Base

class Costo(Base):
    __tablename__ = "costos"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    concepto = Column(String(255), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    tipo = Column(String(50))
    mes = Column(String(20), nullable=False, index=True)
    numero = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Costo {self.id}: {self.concepto} - {self.monto}>"
