"""Ingreso model - Transacciones de ingresos."""
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True, index=True)  # ✅ Agregado índice
    descripcion = Column(Text)
    awb = Column(String(50), index=True)  # ✅ Agregado índice para búsquedas
    moneda = Column(String(3), nullable=False, default="PEN")
    monto = Column(Numeric(12, 2), nullable=False)
    monto_pen = Column(Numeric(12, 2))
    mes = Column(String(20), nullable=False, index=True)
    numero = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    empresa = relationship("Empresa", back_populates="ingresos")

    # Índices compuestos para queries comunes
    __table_args__ = (
        Index('idx_ingreso_mes_fecha', 'mes', 'fecha'),
        Index('idx_ingreso_empresa_mes', 'empresa_id', 'mes'),
    )
    
    def __repr__(self):
        return f"<Ingreso {self.id}: {self.descripcion} - {self.monto}>"
