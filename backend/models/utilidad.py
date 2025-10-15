"""Utilidad model - Cálculos automáticos de utilidades."""
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from datetime import datetime
from core.database import Base

class Utilidad(Base):
    __tablename__ = "utilidades"
    
    id = Column(Integer, primary_key=True, index=True)
    mes = Column(String(20), unique=True, nullable=False, index=True)
    total_ingresos = Column(Numeric(12, 2), default=0)
    total_costos = Column(Numeric(12, 2), default=0)
    utilidad_neta = Column(Numeric(12, 2), default=0)
    margen = Column(Numeric(5, 2), default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Utilidad {self.mes}: {self.utilidad_neta}>"
