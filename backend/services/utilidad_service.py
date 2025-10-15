"""Utilidad service - Automatic calculations."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.utilidad import Utilidad
from models.ingreso import Ingreso
from models.costo import Costo
from typing import Dict, Optional
from decimal import Decimal

def recalcular_utilidad_mes(db: Session, mes: str) -> Utilidad:
    """Recalculate utilidad for given month."""
    # Calculate totals
    total_ingresos = db.query(func.sum(Ingreso.monto_pen))\
                       .filter(Ingreso.mes == mes)\
                       .scalar() or 0
    
    total_costos = db.query(func.sum(Costo.monto))\
                     .filter(Costo.mes == mes)\
                     .scalar() or 0
    
    utilidad_neta = float(total_ingresos) - float(total_costos)
    
    # Calculate margin
    margen = (utilidad_neta / float(total_ingresos) * 100) if float(total_ingresos) > 0 else 0
    
    # Update or create utilidad record
    db_utilidad = db.query(Utilidad).filter(Utilidad.mes == mes).first()
    
    if db_utilidad:
        db_utilidad.total_ingresos = total_ingresos
        db_utilidad.total_costos = total_costos
        db_utilidad.utilidad_neta = utilidad_neta
        db_utilidad.margen = margen
    else:
        db_utilidad = Utilidad(
            mes=mes,
            total_ingresos=total_ingresos,
            total_costos=total_costos,
            utilidad_neta=utilidad_neta,
            margen=margen
        )
        db.add(db_utilidad)
    
    db.commit()
    db.refresh(db_utilidad)
    
    return db_utilidad

def get_utilidad_mes(db: Session, mes: str) -> Optional[Utilidad]:
    """Get utilidad for specific month."""
    utilidad = db.query(Utilidad).filter(Utilidad.mes == mes).first()
    
    # If doesn't exist, calculate it
    if not utilidad:
        utilidad = recalcular_utilidad_mes(db, mes)
    
    return utilidad

def get_todas_utilidades(db: Session) -> Dict[str, Dict]:
    """Get all utilidades grouped by month."""
    utilidades = db.query(Utilidad).order_by(Utilidad.mes).all()
    
    return {
        u.mes: {
            "total_ingresos": float(u.total_ingresos),
            "total_costos": float(u.total_costos),
            "utilidad_neta": float(u.utilidad_neta),
            "margen": float(u.margen)
        }
        for u in utilidades
    }

def calcular_utilidad_bruta(db: Session, mes: str) -> Dict:
    """Calculate utilidad bruta for month."""
    ingresos = db.query(func.sum(Ingreso.monto_pen))\
                 .filter(Ingreso.mes == mes)\
                 .scalar() or 0
    
    costos = db.query(func.sum(Costo.monto))\
               .filter(Costo.mes == mes)\
               .scalar() or 0
    
    utilidad_bruta = float(ingresos) - float(costos)
    margen_bruto = (utilidad_bruta / float(ingresos) * 100) if float(ingresos) > 0 else 0
    
    return {
        "mes": mes,
        "ingresos_totales": float(ingresos),
        "costos_totales": float(costos),
        "utilidad_bruta": utilidad_bruta,
        "margen_bruto_pct": margen_bruto
    }

def calcular_kpis_financieros(db: Session, mes: str) -> Dict:
    """Calculate financial KPIs for month."""
    utilidad = get_utilidad_mes(db, mes)
    
    if not utilidad:
        return {}
    
    ingresos_count = db.query(func.count(Ingreso.id))\
                       .filter(Ingreso.mes == mes)\
                       .scalar() or 0
    
    costos_count = db.query(func.count(Costo.id))\
                     .filter(Costo.mes == mes)\
                     .scalar() or 0
    
    ticket_promedio = float(utilidad.total_ingresos) / ingresos_count if ingresos_count > 0 else 0
    
    return {
        "mes": mes,
        "utilidad_neta": float(utilidad.utilidad_neta),
        "margen_neto": float(utilidad.margen),
        "total_ingresos": float(utilidad.total_ingresos),
        "total_costos": float(utilidad.total_costos),
        "num_ingresos": ingresos_count,
        "num_costos": costos_count,
        "ticket_promedio": ticket_promedio,
        "eficiencia_operativa": (float(utilidad.utilidad_neta) / float(utilidad.total_ingresos) * 100) if float(utilidad.total_ingresos) > 0 else 0
    }
