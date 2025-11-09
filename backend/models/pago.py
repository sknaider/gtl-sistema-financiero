"""Pago model - Cuentas por cobrar."""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Pago(Base):
    __tablename__ = "pagos"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)  # ✅ Agregado índice
    awb = Column(String(50), nullable=False, index=True)  # ✅ Agregado índice para búsquedas por AWB
    estado = Column(String(20), default="NO PAGADO", index=True)
    mes = Column(String(20), nullable=False, index=True)  # ✅ Agregado índice
    fecha_pago = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    empresa = relationship("Empresa", back_populates="pagos")

    # Índices compuestos para queries comunes
    __table_args__ = (
        Index('idx_pago_mes_estado', 'mes', 'estado'),
        Index('idx_pago_empresa_mes', 'empresa_id', 'mes'),
    )
    
    def __repr__(self):
        return f"<Pago {self.id}: {self.awb} - {self.estado}>"
