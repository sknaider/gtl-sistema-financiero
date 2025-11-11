"""Costo model - Transacciones de costos."""
from sqlalchemy import Column, Index, Integer, String, Date, Numeric, DateTime, 
from datetime import datetime
from core.database import Base

class Costo(Base):
    __tablename__ = "costos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    concepto = Column(String(255), nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    tipo = Column(String(50), index=True)  # ✅ Agregado índice para filtros por tipo
    moneda = Column(String(3), default="PEN", index=True)  # ✅ Nuevo campo
    awb = Column(String(50), index=True)  # ✅ Nuevo campo con índice
    mes = Column(String(20), nullable=False, index=True)
    numero = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Índices compuestos para queries comunes
    __table_args__ = (
        Index('idx_costo_mes_fecha', 'mes', 'fecha'),
        Index('idx_costo_tipo_mes', 'tipo', 'mes'),
        Index('idx_costo_awb', 'awb'),  # ✅ Nuevo índice para búsquedas por AWB
    )

    def __repr__(self):
        return f"<Costo {self.id}: {self.concepto} - {self.monto}>"
