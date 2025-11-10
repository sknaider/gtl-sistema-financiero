from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.ingreso import Ingreso
from models.costo import Costo
from models.utilidad import Utilidad
from models.pago import Pago
import subprocess
from datetime import datetime
import os

router = APIRouter()

@router.post("/backup-and-reset/{mes}")
def backup_and_reset(mes: str, db: Session = Depends(get_db)):
    """Crea backup y resetea datos del mes especificado"""
    
    # 1. Crear backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = "/home/gtl.pe/backups"
    backup_file = f"{backup_dir}/before_reset_{mes}_{timestamp}.sql"
    
    os.makedirs(backup_dir, exist_ok=True)
    
    try:
        subprocess.run([
            "pg_dump",
            "-U", "glt_user",
            "-d", "glt_financiero",
            "-f", backup_file
        ], env={"PGPASSWORD": "GLT_2025_Secure!"}, check=True)
    except Exception as e:
        raise HTTPException(500, f"Error creando backup: {str(e)}")
    
    # 2. Contar registros antes
    count_ingresos = db.query(Ingreso).filter(Ingreso.mes == mes).count()
    count_costos = db.query(Costo).filter(Costo.mes == mes).count()
    count_pagos = db.query(Pago).filter(Pago.mes == mes).count()
    
    # 3. Resetear datos
    db.query(Ingreso).filter(Ingreso.mes == mes).delete()
    db.query(Costo).filter(Costo.mes == mes).delete()
    db.query(Pago).filter(Pago.mes == mes).delete()
    db.query(Utilidad).filter(Utilidad.mes == mes).delete()
    db.commit()
    
    return {
        "success": True,
        "backup_file": backup_file,
        "deleted": {
            "ingresos": count_ingresos,
            "costos": count_costos,
            "pagos": count_pagos
        },
        "mes": mes
    }
