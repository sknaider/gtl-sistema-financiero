"""Ingreso service - Business logic."""
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from models.ingreso import Ingreso
from schemas.ingreso import IngresoCreate, IngresoUpdate
from services.conversion_service import convert_to_pen
from datetime import date
from typing import List, Optional, Dict

def create_ingreso(db: Session, ingreso: IngresoCreate) -> Ingreso:
    """Create new ingreso with automatic PEN conversion."""
    monto_pen = convert_to_pen(ingreso.monto, ingreso.moneda)
    
    # Get next numero for the month
    max_numero = db.query(func.max(Ingreso.numero))\
                   .filter(Ingreso.mes == ingreso.mes)\
                   .scalar()
    numero = (max_numero or 0) + 1
    
    db_ingreso = Ingreso(
        **ingreso.model_dump(),
        monto_pen=monto_pen,
        numero=numero
    )
    db.add(db_ingreso)
    db.commit()
    db.refresh(db_ingreso)
    
    # Trigger utilidad recalculation
    from services.utilidad_service import recalcular_utilidad_mes
    recalcular_utilidad_mes(db, ingreso.mes)
    
    return db_ingreso

def get_ingresos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    mes: Optional[str] = None
) -> List[Ingreso]:
    """Get ingresos with optional filters."""
    query = db.query(Ingreso)
    
    if mes:
        query = query.filter(Ingreso.mes == mes)
    
    return query.order_by(Ingreso.fecha.desc())\
                .offset(skip)\
                .limit(limit)\
                .all()

def get_ingreso(db: Session, ingreso_id: int) -> Optional[Ingreso]:
    """Get single ingreso by ID."""
    return db.query(Ingreso).filter(Ingreso.id == ingreso_id).first()

def update_ingreso(
    db: Session,
    ingreso_id: int,
    ingreso_update: IngresoUpdate
) -> Optional[Ingreso]:
    """Update existing ingreso."""
    db_ingreso = get_ingreso(db, ingreso_id)
    if not db_ingreso:
        return None
    
    update_data = ingreso_update.model_dump(exclude_unset=True)
    
    # Recalculate monto_pen if monto or moneda changed
    if 'monto' in update_data or 'moneda' in update_data:
        monto = update_data.get('monto', db_ingreso.monto)
        moneda = update_data.get('moneda', db_ingreso.moneda)
        update_data['monto_pen'] = convert_to_pen(monto, moneda)
    
    for field, value in update_data.items():
        setattr(db_ingreso, field, value)
    
    db.commit()
    db.refresh(db_ingreso)
    
    # Trigger utilidad recalculation
    from services.utilidad_service import recalcular_utilidad_mes
    recalcular_utilidad_mes(db, db_ingreso.mes)
    
    return db_ingreso

def delete_ingreso(db: Session, ingreso_id: int) -> bool:
    """Delete ingreso."""
    db_ingreso = get_ingreso(db, ingreso_id)
    if not db_ingreso:
        return False
    
    mes = db_ingreso.mes
    db.delete(db_ingreso)
    db.commit()
    
    # Trigger utilidad recalculation
    from services.utilidad_service import recalcular_utilidad_mes
    recalcular_utilidad_mes(db, mes)
    
    return True

def calcular_total_periodo(
    db: Session,
    fecha_inicio: date,
    fecha_fin: date
) -> float:
    """Calculate total ingresos for period."""
    total = db.query(func.sum(Ingreso.monto_pen))\
              .filter(Ingreso.fecha.between(fecha_inicio, fecha_fin))\
              .scalar()
    return float(total or 0)

def analizar_por_mes(db: Session) -> Dict[str, float]:
    """Group ingresos by month."""
    results = db.query(
        Ingreso.mes,
        func.sum(Ingreso.monto_pen).label('total')
    ).group_by(Ingreso.mes).all()
    
    return {r.mes: float(r.total) for r in results}

def get_kpis_mes(db: Session, mes: str) -> Dict:
    """Get KPIs for specific month."""
    total = db.query(func.sum(Ingreso.monto_pen))\
              .filter(Ingreso.mes == mes)\
              .scalar()
    
    count = db.query(func.count(Ingreso.id))\
              .filter(Ingreso.mes == mes)\
              .scalar()
    
    avg = db.query(func.avg(Ingreso.monto_pen))\
            .filter(Ingreso.mes == mes)\
            .scalar()
    
    return {
        "ingreso_mensual": float(total or 0),
        "num_transacciones": count or 0,
        "ticket_promedio": float(avg or 0)
    }
