"""Costo service - Business logic."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.costo import Costo
from schemas.costo import CostoCreate, CostoUpdate
from datetime import date
from typing import List, Optional, Dict

def create_costo(db: Session, costo: CostoCreate) -> Costo:
    """Create new costo."""
    # Get next numero for the month
    max_numero = db.query(func.max(Costo.numero))\
                   .filter(Costo.mes == costo.mes)\
                   .scalar()
    numero = (max_numero or 0) + 1
    
    db_costo = Costo(
        **costo.model_dump(),
        numero=numero
    )
    db.add(db_costo)
    db.commit()
    db.refresh(db_costo)
    
    # Trigger utilidad recalculation
    from services.utilidad_service import recalcular_utilidad_mes
    recalcular_utilidad_mes(db, costo.mes)
    
    return db_costo

def get_costos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    mes: Optional[str] = None
) -> List[Costo]:
    """Get costos with optional filters."""
    query = db.query(Costo)
    
    if mes:
        query = query.filter(Costo.mes == mes)
    
    return query.order_by(Costo.fecha.desc())\
                .offset(skip)\
                .limit(limit)\
                .all()

def get_costo(db: Session, costo_id: int) -> Optional[Costo]:
    """Get single costo by ID."""
    return db.query(Costo).filter(Costo.id == costo_id).first()

def update_costo(
    db: Session,
    costo_id: int,
    costo_update: CostoUpdate
) -> Optional[Costo]:
    """Update existing costo."""
    db_costo = get_costo(db, costo_id)
    if not db_costo:
        return None
    
    update_data = costo_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_costo, field, value)
    
    db.commit()
    db.refresh(db_costo)
    
    # Trigger utilidad recalculation
    from services.utilidad_service import recalcular_utilidad_mes
    recalcular_utilidad_mes(db, db_costo.mes)
    
    return db_costo

def delete_costo(db: Session, costo_id: int) -> bool:
    """Delete costo."""
    db_costo = get_costo(db, costo_id)
    if not db_costo:
        return False
    
    mes = db_costo.mes
    db.delete(db_costo)
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
    """Calculate total costos for period."""
    total = db.query(func.sum(Costo.monto))\
              .filter(Costo.fecha.between(fecha_inicio, fecha_fin))\
              .scalar()
    return float(total or 0)

def analizar_por_mes(db: Session) -> Dict[str, float]:
    """Group costos by month."""
    results = db.query(
        Costo.mes,
        func.sum(Costo.monto).label('total')
    ).group_by(Costo.mes).all()
    
    return {r.mes: float(r.total) for r in results}

def get_kpis_mes(db: Session, mes: str) -> Dict:
    """Get KPIs for specific month."""
    total = db.query(func.sum(Costo.monto))\
              .filter(Costo.mes == mes)\
              .scalar()
    
    count = db.query(func.count(Costo.id))\
              .filter(Costo.mes == mes)\
              .scalar()
    
    avg = db.query(func.avg(Costo.monto))\
            .filter(Costo.mes == mes)\
            .scalar()
    
    return {
        "costo_mensual": float(total or 0),
        "num_transacciones": count or 0,
        "costo_promedio": float(avg or 0)
    }
