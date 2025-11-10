import pandas as pd

# Test lectura Excel
try:
    df = pd.read_excel('/tmp/test.xlsx', sheet_name=0)
    print("✅ Lectura OK")
    print(df.head())
except Exception as e:
    print(f"❌ Error: {e}")
