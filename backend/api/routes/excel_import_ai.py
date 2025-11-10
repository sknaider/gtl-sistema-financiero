from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
from services.ai_excel_analyzer import get_ai_analyzer

router = APIRouter()

@router.post("/excel/ai-analyze")
async def ai_analyze_excel(file: UploadFile = File(...), sheet_name: str = None):
    """Analizar Excel con Claude AI"""
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "Solo archivos Excel")
    
    contents = await file.read()
    
    # Si no se especifica hoja, usar la primera
    if sheet_name is None:
        xl = pd.ExcelFile(io.BytesIO(contents))
        sheet_name = xl.sheet_names[0]
    
    df = pd.read_excel(io.BytesIO(contents), sheet_name=sheet_name)
    
    # Detectar estructura vertical
    is_vertical = False
    if len(df) > 0:
        first_cell = str(df.iloc[0, 0]).upper()
        is_vertical = first_cell in ['FECHA', 'CLIENTE', 'MONTO']
    
    if is_vertical:
        df = df.T
        df.columns = df.iloc[0]
        df = df[1:]
    
    # Preparar datos para IA
    columns = df.columns.tolist()
    sample_data = df.head(5).fillna('').to_dict('records')
    
    # Analizar con IA
    ai_analyzer = get_ai_analyzer()
    analysis = ai_analyzer.analyze_columns(columns, sample_data)
    
    return {
        "filename": file.filename,
        "sheet_name": sheet_name,
        "is_vertical": is_vertical,
        "total_rows": len(df),
        "columns": columns,
        "ai_analysis": analysis,
        "sample_data": sample_data[:3]
    }

@router.post("/excel/ai-import-all")
async def ai_import_all_sheets(file: UploadFile = File(...)):
    """Importar TODAS las hojas usando IA para mapeo"""
    
    contents = await file.read()
    xl = pd.ExcelFile(io.BytesIO(contents))
    
    ai_analyzer = get_ai_analyzer()
    results = []
    
    for sheet_name in xl.sheet_names:
        try:
            df = pd.read_excel(io.BytesIO(contents), sheet_name=sheet_name)
            
            # Detectar vertical
            is_vertical = False
            if len(df) > 0:
                first_cell = str(df.iloc[0, 0]).upper()
                is_vertical = first_cell in ['FECHA', 'CLIENTE', 'MONTO']
            
            if is_vertical:
                df = df.T
                df.columns = df.iloc[0]
                df = df[1:]
            
            # Analizar con IA
            columns = df.columns.tolist()
            sample_data = df.head(3).fillna('').to_dict('records')
            
            ai_result = ai_analyzer.analyze_columns(columns, sample_data)
            
            results.append({
                "sheet": sheet_name,
                "rows": len(df),
                "ai_mappings": ai_result.get("mappings", {}),
                "confidence": ai_result.get("confidence", {}),
                "issues": ai_result.get("issues", []),
                "can_import": len(ai_result.get("mappings", {})) >= 3  # Necesita al menos 3 campos
            })
            
        except Exception as e:
            results.append({
                "sheet": sheet_name,
                "error": str(e),
                "can_import": False
            })
    
    return {
        "filename": file.filename,
        "total_sheets": len(results),
        "importable_sheets": len([r for r in results if r.get("can_import", False)]),
        "sheets": results
    }
