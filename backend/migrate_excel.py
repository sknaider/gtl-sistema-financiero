import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime
import sys

DATABASE_URL = "postgresql://glt_user:GLT_2025_Secure!@localhost:5432/glt_financiero"
engine = create_engine(DATABASE_URL)

def migrate_ingresos(filepath, mes):
    df = pd.read_excel(filepath, sheet_name=f'INGRESOS_{mes}')
    
    # Si estructura vertical (headers en columna A)
    if df.iloc[0, 0] == 'FECHA':
        df = df.T
        df.columns = df.iloc[0]
        df = df[1:]
    
    df['mes'] = mes
    df.to_sql('ingresos', engine, if_exists='append', index=False)
    print(f"✅ {len(df)} ingresos de {mes} migrados")

# Ejecutar
migrate_ingresos('EXCELGLT.xlsm', 'AGOSTO')
print("🎉 Migración completada")
