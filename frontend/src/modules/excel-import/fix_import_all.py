import re

with open('ExcelImport.jsx', 'r') as f:
    content = f.read()

# Buscar y reemplazar la línea del api.post para import-all-sheets
content = re.sub(
    r"(const res = await api\.post\('/excel/import-all-sheets', formData)\);",
    r"\1, {\n        headers: { 'Content-Type': 'multipart/form-data' }\n      });",
    content
)

with open('ExcelImport.jsx', 'w') as f:
    f.write(content)

print("✅ Headers agregados a handleImportAll")
