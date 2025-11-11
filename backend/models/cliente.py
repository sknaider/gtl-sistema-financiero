from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    dni = Column(String)
    telefono = Column(String)
    email = Column(String)
    color = Column(String, default='#3B82F6')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    empresas = relationship("Empresa", back_populates="cliente")
    ingresos = relationship("Ingreso", back_populates="cliente")
    pagos = relationship("Pago", back_populates="cliente")  # ✅ Faltaba esta relación
