from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, Text, Numeric, JSON
from sqlalchemy.sql import func
from core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String(50), nullable=False)  # 'create', 'update', 'delete'
    entity_type = Column(String(50), nullable=False)  # 'ingreso', 'costo', 'pago'
    entity_id = Column(Integer, nullable=False)
    old_value = Column(JSON, nullable=True)  # Estado anterior como JSON
    new_value = Column(JSON, nullable=True)  # Estado nuevo como JSON
    ai_confidence = Column(Numeric(5, 4), nullable=True)  # Score 0.0000 - 1.0000
    user_confirmation = Column(Boolean, default=False)
    executed_at = Column(TIMESTAMP, server_default=func.now())
    ip_address = Column(String(50), nullable=True)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AuditLog {self.action_type} {self.entity_type}#{self.entity_id}>"
