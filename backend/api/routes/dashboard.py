"""Dashboard API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from services import dashboard_service

router = APIRouter(tags=["dashboard"])

@router.get("/kpis/{mes}")
def get_dashboard_kpis(mes: str, db: Session = Depends(get_db)):
    """Obtener KPIs del dashboard para un mes específico."""
    return dashboard_service.get_kpis_mes(db, mes)

@router.get("/resumen-anual")
def get_resumen_anual(año: int = None, db: Session = Depends(get_db)):
    """Obtener resumen anual."""
    return dashboard_service.get_resumen_anual(db, año)
