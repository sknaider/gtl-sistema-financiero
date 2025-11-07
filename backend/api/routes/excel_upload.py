from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
from core.database import get_db
from models.ingreso import Ingreso
from models.costo import Costo
from models.empresa import Empresa
import io
from datetime import datetime

router = APIRouter()

@router.post("/upload/ingresos")
async def upload_ingresos_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "Solo archivos Excel")
    
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents), sheet_name=0)
    
    # Transponer si estructura vertical
    if df.iloc[0, 0] == 'FECHA':
        df = df.T
        df.columns = df.iloc[0]
        df = df[1:]
    
    registros = []
    for _, row in df.iterrows():
        ing = Ingreso(
            fecha=pd.to_datetime(row['FECHA']).date(),
            cliente=row['CLIENTE'],
            descripcion=row.get('DESCRIPCION', ''),
            awb=row.get('AWB', ''),
            moneda=row.get('MONEDA', 'USD'),
            monto=float(row['MONTO']),
            mes=row.get('MES', datetime.now().strftime('%B').upper())
        )
        registros.append(ing)
    
    db.add_all(registros)
    db.commit()
    
    return {"message": f"{len(registros)} registros importados"}
