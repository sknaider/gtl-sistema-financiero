"""Pagos API routes - Cuentas por cobrar."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from core.database import get_db
from models.pago import Pago
from models.empresa import Empresa

router = APIRouter(tags=["pagos"])

@router.get("/")
def listar_pagos(
    mes: Optional[str] = None,
    estado: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """List pagos with filters."""
    query = db.query(Pago).join(Empresa)
    
    if mes:
        query = query.filter(Pago.mes == mes)
    
    if estado:
        query = query.filter(Pago.estado == estado)
    
    pagos = query.order_by(Empresa.nombre)\
                 .offset(skip)\
                 .limit(limit)\
                 .all()
    
    return [
        {
            "id": p.id,
            "empresa_id": p.empresa_id,
            "empresa_nombre": p.empresa.nombre,
            "awb": p.awb,
            "estado": p.estado,
            "mes": p.mes,
            "fecha_pago": p.fecha_pago
        }
        for p in pagos
    ]

@router.get("/{pago_id}")
def obtener_pago(pago_id: int, db: Session = Depends(get_db)):
    """Get single pago."""
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    return {
        "id": pago.id,
        "empresa_id": pago.empresa_id,
        "empresa_nombre": pago.empresa.nombre,
        "awb": pago.awb,
        "estado": pago.estado,
        "mes": pago.mes,
        "fecha_pago": pago.fecha_pago
    }

@router.put("/{pago_id}/estado")
def actualizar_estado_pago(
    pago_id: int,
    estado: str,
    fecha_pago: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Update pago status."""
    if estado not in ["NO PAGADO", "PAGADO"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    pago = db.query(Pago).filter(Pago.id == pago_id).first()
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    pago.estado = estado
    if estado == "PAGADO" and fecha_pago:
        pago.fecha_pago = fecha_pago
    
    db.commit()
    db.refresh(pago)
    
    return {
        "id": pago.id,
        "empresa_nombre": pago.empresa.nombre,
        "awb": pago.awb,
        "estado": pago.estado,
        "fecha_pago": pago.fecha_pago
    }

@router.get("/mes/{mes}/estadisticas")
def estadisticas_pagos(mes: str, db: Session = Depends(get_db)):
    """Get payment statistics for month."""
    total = db.query(Pago).filter(Pago.mes == mes).count()
    pagados = db.query(Pago).filter(
        Pago.mes == mes,
        Pago.estado == "PAGADO"
    ).count()
    
    return {
        "mes": mes,
        "total_cuentas": total,
        "pagados": pagados,
        "pendientes": total - pagados,
        "porcentaje_cobrado": (pagados / total * 100) if total > 0 else 0
    }
