from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime
from difflib import SequenceMatcher
import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import PatternFill, Font, Alignment
from core.database import get_db
from models.import_history import ImportHistory

router = APIRouter()

COLUMN_MAPPINGS = {
    'FECHA': ['date', 'dia', 'day', 'when', 'fecha_operacion', 'fecha_ingreso'],
    'CLIENTE': ['customer', 'company', 'compania', 'client', 'empresa', 'razon_social', 'name', 'nombre'],
    'MONTO': ['amount', 'value', 'valor', 'price', 'precio', 'total', 'importe'],
    'MONEDA': ['currency', 'coin', 'tipo_moneda', 'curr'],
    'AWB': ['waybill', 'guia', 'tracking', 'numero_guia', 'air_waybill'],
    'DESCRIPCION': ['description', 'detail', 'detalle', 'concepto', 'notes', 'notas'],
    'MES': ['month', 'periodo', 'period', 'mes_operacion']
}

def fuzzy_match_column(col_name: str, threshold: float = 0.7):
    col_lower = col_name.lower().strip()
    
    for target, aliases in COLUMN_MAPPINGS.items():
        if col_lower == target.lower():
            return target, 1.0
        for alias in aliases:
            if col_lower == alias.lower():
                return target, 0.95
    
    best_match = None
    best_score = 0
    
    for target, aliases in COLUMN_MAPPINGS.items():
        score = SequenceMatcher(None, col_lower, target.lower()).ratio()
        if score > best_score and score >= threshold:
            best_score = score
            best_match = target
        
        for alias in aliases:
            score = SequenceMatcher(None, col_lower, alias.lower()).ratio()
            if score > best_score and score >= threshold:
                best_score = score
                best_match = target
    
    return best_match, best_score if best_match else None

@router.post("/excel/preview")
async def preview_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "Solo archivos Excel (.xlsx, .xls)")
    
    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents), sheet_name=0)
    
    is_vertical = df.iloc[0, 0] in ['FECHA', 'CLIENTE', 'MONTO', 'fecha', 'cliente', 'monto']
    
    if is_vertical:
        df = df.T
        df.columns = df.iloc[0]
        df = df[1:]
    
    column_mapping = {}
    unmapped_columns = []
    mapping_confidence = {}
    
    for col in df.columns:
        matched, confidence = fuzzy_match_column(str(col))
        if matched:
            column_mapping[col] = matched
            mapping_confidence[col] = confidence
        else:
            unmapped_columns.append(col)
    
    df_mapped = df.rename(columns=column_mapping)
    
    errores = []
    sugerencias = []
    
    required_cols = ['FECHA', 'CLIENTE', 'MONTO']
    missing = [col for col in required_cols if col not in df_mapped.columns]
    if missing:
        errores.append(f"⚠️ Columnas requeridas no detectadas: {', '.join(missing)}")
        if unmapped_columns:
            sugerencias.append(f"💡 Columnas sin mapear: {', '.join(unmapped_columns)}")
    
    if 'FECHA' in df_mapped.columns:
        try:
            df_mapped['FECHA'] = pd.to_datetime(df_mapped['FECHA'])
        except:
            errores.append("Columna FECHA contiene valores inválidos")
    
    if 'MONTO' in df_mapped.columns:
        non_numeric = []
        for idx, val in df_mapped['MONTO'].items():
            try:
                float(val)
            except:
                non_numeric.append(idx + 2)
        if non_numeric:
            errores.append(f"Filas {non_numeric[:5]} tienen montos no numéricos")
    
    if 'MONEDA' not in df_mapped.columns:
        sugerencias.append("💡 Agregar columna MONEDA (USD/PEN)")
    
    if 'AWB' not in df_mapped.columns:
        sugerencias.append("💡 Agregar columna AWB para tracking")
    
    preview_data = df_mapped.head(100).fillna('').to_dict('records')
    
    return {
        "status": "success" if not errores else "warning",
        "errores": errores,
        "sugerencias": sugerencias,
        "total_registros": len(df_mapped),
        "columnas": df_mapped.columns.tolist(),
        "columnas_originales": df.columns.tolist(),
        "column_mapping": column_mapping,
        "mapping_confidence": mapping_confidence,
        "unmapped_columns": unmapped_columns,
        "preview": preview_data,
        "estructura_detectada": "vertical" if is_vertical else "horizontal",
        "filename": file.filename
    }

@router.post("/excel/confirm")
async def confirm_import(data: dict, db: Session = Depends(get_db)):
    from models.ingreso import Ingreso
    
    filename = data.get('filename', 'unknown.xlsx')
    total_rows = len(data['registros'])
    success_count = 0
    error_count = 0
    errors_log = []
    
    try:
        registros = []
        for idx, row in enumerate(data['registros']):
            try:
                row_clean = {k: v for k, v in row.items() if not k.startswith('_')}
                
                ing = Ingreso(
                    fecha=datetime.strptime(str(row_clean['FECHA']).split()[0], '%Y-%m-%d'),
                    cliente=row_clean['CLIENTE'],
                    monto=float(row_clean['MONTO']),
                    moneda=row_clean.get('MONEDA', 'USD'),
                    awb=row_clean.get('AWB', ''),
                    descripcion=row_clean.get('DESCRIPCION', ''),
                    mes=row_clean.get('MES', datetime.now().strftime('%B').upper())
                )
                registros.append(ing)
                success_count += 1
            except Exception as e:
                error_count += 1
                errors_log.append({"row": idx + 1, "error": str(e)})
        
        db.add_all(registros)
        db.commit()
        
        # Guardar historial
        history = ImportHistory(
            filename=filename,
            total_rows=total_rows,
            success_rows=success_count,
            error_rows=error_count,
            status='success' if error_count == 0 else 'partial',
            errors_log=errors_log if errors_log else None,
            column_mapping=data.get('column_mapping')
        )
        db.add(history)
        db.commit()
        
        return {
            "message": f"✅ {success_count} registros importados correctamente",
            "success": success_count,
            "errors": error_count
        }
    
    except Exception as e:
        db.rollback()
        
        # Log error completo
        history = ImportHistory(
            filename=filename,
            total_rows=total_rows,
            success_rows=0,
            error_rows=total_rows,
            status='failed',
            errors_log=[{"error": str(e)}]
        )
        db.add(history)
        db.commit()
        
        raise HTTPException(500, f"Error: {str(e)}")

@router.get("/excel/history")
async def get_import_history(db: Session = Depends(get_db)):
    """Obtener historial de importaciones"""
    history = db.query(ImportHistory).order_by(ImportHistory.created_at.desc()).limit(50).all()
    
    return [{
        "id": h.id,
        "filename": h.filename,
        "uploaded_by": h.uploaded_by,
        "total_rows": h.total_rows,
        "success_rows": h.success_rows,
        "error_rows": h.error_rows,
        "status": h.status,
        "created_at": h.created_at.isoformat(),
        "has_errors": h.errors_log is not None
    } for h in history]

@router.get("/excel/template")
async def download_template():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "INGRESOS"
    
    headers = ['FECHA', 'CLIENTE', 'DESCRIPCION', 'AWB', 'MONEDA', 'MONTO', 'MES']
    ws.append(headers)
    
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=12)
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    example = ['2025-11-07', 'CORPORACION EJEMPLO SAC', 'Servicio export', '074 7014 1234', 'USD', 50000.00, 'NOVIEMBRE']
    ws.append(example)
    
    example_fill = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
    for col in range(1, 8):
        ws.cell(row=2, column=col).fill = example_fill
    
    dv_moneda = DataValidation(type="list", formula1='"USD,PEN"')
    ws.add_data_validation(dv_moneda)
    dv_moneda.add('E3:E1000')
    
    meses = "ENERO,FEBRERO,MARZO,ABRIL,MAYO,JUNIO,JULIO,AGOSTO,SETIEMBRE,OCTUBRE,NOVIEMBRE,DICIEMBRE"
    dv_mes = DataValidation(type="list", formula1=f'"{meses}"')
    ws.add_data_validation(dv_mes)
    dv_mes.add('G3:G1000')
    
    for col, width in zip(['A','B','C','D','E','F','G'], [12,35,30,18,10,15,15]):
        ws.column_dimensions[col].width = width
    
    ws_inst = wb.create_sheet("INSTRUCCIONES")
    instructions = [
        ["📋 GTL TEMPLATE - INGRESOS"],
        [""],
        ["✅ Fuzzy Mapping: 'Customer' → CLIENTE, 'Amount' → MONTO"],
        ["✅ Llenar desde fila 3"],
        ["✅ Subir en: gtl.pe/sistema/excel-import"]
    ]
    
    for row in instructions:
        ws_inst.append(row)
    
    ws_inst.column_dimensions['A'].width = 70
    ws_inst['A1'].font = Font(size=14, bold=True, color="1F4E78")
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=GTL_Template_Ingresos.xlsx'}
    )
