import pandas as pd
import sys

file_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/CONTROL_2024-2025.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print(f"\n📊 ANÁLISIS DE {file_path}")
    print(f"Total de hojas: {len(xl.sheet_names)}\n")
    
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        print(f"📄 Hoja: {sheet_name}")
        print(f"   Filas: {len(df)}, Columnas: {len(df.columns)}")
        print(f"   Columnas: {list(df.columns[:10])}")
        
        # Ver si es vertical
        if len(df) > 0:
            first_cell = str(df.iloc[0, 0]).upper()
            if first_cell in ['FECHA', 'CLIENTE', 'MONTO']:
                print(f"   ⭐ ESTRUCTURA VERTICAL detectada")
        print()
        
except Exception as e:
    print(f"❌ Error: {e}")
