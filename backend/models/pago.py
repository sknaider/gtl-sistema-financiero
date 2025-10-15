"""Pago model - Cuentas por cobrar."""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Pago(Base):
    __tablename__ = "pagos"
    
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    awb = Column(String(50), nullable=False)
    estado = Column(String(20), default="NO PAGADO", index=True)
    mes = Column(String(20), nullable=False)
    fecha_pago = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    empresa = relationship("Empresa", back_populates="pagos")
    
    def __repr__(self):
        return f"<Pago {self.id}: {self.awb} - {self.estado}>"
