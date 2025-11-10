"""TipoCosto service."""
from sqlalchemy.orm import Session
from models.tipo_costo import TipoCosto
from schemas.tipo_costo import TipoCostoCreate, TipoCostoUpdate

def get_all(db: Session, incluir_inactivos: bool = False):
    """Get all tipos de costo."""
    query = db.query(TipoCosto)
    if not incluir_inactivos:
        query = query.filter(TipoCosto.activo == True)
    return query.order_by(TipoCosto.nombre).all()

def get_by_id(db: Session, tipo_id: int):
    """Get tipo by ID."""
    return db.query(TipoCosto).filter(TipoCosto.id == tipo_id).first()

def create(db: Session, tipo: TipoCostoCreate):
    """Create new tipo."""
    db_tipo = TipoCosto(**tipo.model_dump())
    db.add(db_tipo)
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

def update(db: Session, tipo_id: int, tipo: TipoCostoUpdate):
    """Update tipo."""
    db_tipo = get_by_id(db, tipo_id)
    if not db_tipo:
        return None
    
    for key, value in tipo.model_dump(exclude_unset=True).items():
        setattr(db_tipo, key, value)
    
    db.commit()
    db.refresh(db_tipo)
    return db_tipo

def delete(db: Session, tipo_id: int):
    """Delete (deactivate) tipo."""
    db_tipo = get_by_id(db, tipo_id)
    if not db_tipo:
        return False
    
    db_tipo.activo = False
    db.commit()
    return True
