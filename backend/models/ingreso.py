"""Ingreso model - Transacciones de ingresos."""
from sqlalchemy import Column, Index, Integer, String, Date, Numeric, DateTime, ForeignKey, Text, 
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Ingreso(Base):
    __tablename__ = "ingresos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True, index=True)  # ✅ Con índice
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True, index=True)  # ✅ Nuevo campo con índice
    descripcion = Column(Text)
    awb = Column(String(50), index=True)  # ✅ Agregado índice para búsquedas
    moneda = Column(String(3), nullable=False, default="PEN", index=True)
    monto = Column(Numeric(12, 2), nullable=False)
    monto_pen = Column(Numeric(12, 2))
    mes = Column(String(20), nullable=False, index=True)
    numero = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    empresa = relationship("Empresa", back_populates="ingresos")
    cliente = relationship("Cliente", back_populates="ingresos")

    # Índices compuestos para queries comunes
    __table_args__ = (
        Index('idx_ingreso_mes_fecha', 'mes', 'fecha'),
        Index('idx_ingreso_empresa_mes', 'empresa_id', 'mes'),
        Index('idx_ingreso_cliente_mes', 'cliente_id', 'mes'),  # ✅ Nuevo índice
    )

    def __repr__(self):
        return f"<Ingreso {self.id}: {self.descripcion} - {self.monto}>"
