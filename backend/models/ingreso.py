"""Ingreso model - Transacciones de ingresos."""
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Ingreso(Base):
    __tablename__ = "ingresos"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    descripcion = Column(Text)
    awb = Column(String(50))
    moneda = Column(String(3), nullable=False, default="PEN")
    monto = Column(Numeric(12, 2), nullable=False)
    monto_pen = Column(Numeric(12, 2))
    mes = Column(String(20), nullable=False, index=True)
    numero = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    empresa = relationship("Empresa", back_populates="ingresos")
    
    def __repr__(self):
        return f"<Ingreso {self.id}: {self.descripcion} - {self.monto}>"
