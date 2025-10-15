"""Utilidades API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from services import utilidad_service

router = APIRouter(tags=["utilidades"])

@router.get("/{mes}")
def obtener_utilidad_mes(mes: str, db: Session = Depends(get_db)):
    """Get utilidad for specific month."""
    utilidad = utilidad_service.get_utilidad_mes(db, mes)
    if not utilidad:
        # Si no existe, calcularla automáticamente
        utilidad = utilidad_service.recalcular_utilidad_mes(db, mes)
    
    return {
        "mes": utilidad.mes,
        "total_ingresos": float(utilidad.total_ingresos),
        "total_costos": float(utilidad.total_costos),
        "utilidad_neta": float(utilidad.utilidad_neta),
        "margen": float(utilidad.margen)
    }

@router.get("/")
def listar_utilidades(db: Session = Depends(get_db)):
    """Get all utilidades."""
    return utilidad_service.get_todas_utilidades(db)

@router.post("/{mes}/recalcular")
def recalcular_utilidad(mes: str, db: Session = Depends(get_db)):
    """Force recalculation of utilidad for month."""
    utilidad = utilidad_service.recalcular_utilidad_mes(db, mes)
    return {
        "mes": utilidad.mes,
        "total_ingresos": float(utilidad.total_ingresos),
        "total_costos": float(utilidad.total_costos),
        "utilidad_neta": float(utilidad.utilidad_neta),
        "margen": float(utilidad.margen)
    }
