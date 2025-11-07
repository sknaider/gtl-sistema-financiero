from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from core.database import Base

class ImportHistory(Base):
    __tablename__ = "import_history"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    uploaded_by = Column(String(100), default='admin')
    total_rows = Column(Integer, nullable=False)
    success_rows = Column(Integer, nullable=False)
    error_rows = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    errors_log = Column(JSON)
    column_mapping = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
