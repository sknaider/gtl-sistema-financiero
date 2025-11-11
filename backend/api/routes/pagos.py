"""Pagos routes - Cuentas por cobrar."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from core.database import get_db
from models.pago import Pago
from models.empresa import Empresa
from models.cliente import Cliente
from models.ingreso import Ingreso
from schemas.pago import PagoResponse, PagoUpdate, PagoEstadisticas

router = APIRouter()

@router.get("/", response_model=List[PagoResponse])
def listar_pagos(
    mes: Optional[str] = None,
    estado: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(default=200, le=1000),
    db: Session = Depends(get_db)
):
    """List pagos with filters."""
    query = db.query(Pago)\
        .options(joinedload(Pago.empresa), joinedload(Pago.cliente))
    
    if mes:
        query = query.filter(Pago.mes == mes)
    if estado:
        query = query.filter(Pago.estado == estado)
    
    pagos = query.order_by(Pago.updated_at.desc())\
                 .offset(skip)\
                 .limit(limit)\
                 .all()
    
    # Agregar nombre correcto a cada pago
    result = []
    for pago in pagos:
        # Buscar fecha del ingreso
        ingreso = db.query(Ingreso).filter(
            Ingreso.awb == pago.awb,
            Ingreso.mes == pago.mes
        ).first()
        
        pago_dict = {
            "id": pago.id,
            "empresa_id": pago.empresa_id,
            "cliente_id": pago.cliente_id,
            "awb": pago.awb,
            "estado": pago.estado,
            "mes": pago.mes,
            "fecha_pago": pago.fecha_pago,
            "fecha_ingreso": ingreso.fecha if ingreso else None,
            "updated_at": pago.updated_at,
            "nombre_empresa": pago.cliente.nombre if pago.cliente else (pago.empresa.nombre if pago.empresa else "Sin nombre")
        }
        result.append(pago_dict)
    
    return result

@router.put("/{pago_id}", response_model=PagoResponse)
def actualizar_pago(pago_id: int, pago_data: PagoUpdate, db: Session = Depends(get_db)):
    """Update pago status."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(404, "Pago no encontrado")
    
    for field, value in pago_data.model_dump(exclude_unset=True).items():
        setattr(pago, field, value)
    
    db.commit()
    db.refresh(pago)
    
    # Agregar nombre
    pago_dict = {
        "id": pago.id,
        "empresa_id": pago.empresa_id,
        "cliente_id": pago.cliente_id,
        "awb": pago.awb,
        "estado": pago.estado,
        "mes": pago.mes,
        "fecha_pago": pago.fecha_pago,
        "updated_at": pago.updated_at,
        "nombre_empresa": pago.cliente.nombre if pago.cliente else (pago.empresa.nombre if pago.empresa else "Sin nombre")
    }
    
    return pago_dict

@router.get("/mes/{mes}/estadisticas", response_model=PagoEstadisticas)
def estadisticas_pagos(mes: str, db: Session = Depends(get_db)):
    """Get statistics for payments by month."""
    total = db.query(Pago).filter(Pago.mes == mes).count()
    pagados = db.query(Pago).filter(Pago.mes == mes, Pago.estado == "PAGADO").count()
    pendientes = total - pagados
    
    return {
        "total": total,
        "pagados": pagados,
        "pendientes": pendientes
    }
