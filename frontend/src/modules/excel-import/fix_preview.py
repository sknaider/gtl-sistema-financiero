import re

with open('ExcelImport.jsx', 'r') as f:
    content = f.read()

# Buscar y reemplazar handlePreviewSheet
old_pattern = r'const handlePreviewSheet = async \(sheetName\) => \{[^}]+const formData = new FormData\(\);[^}]+formData\.append\(\'file\', file\);[^}]+formData\.append\(\'sheet_name\', sheetName\);[^}]+setLoading\(true\);[^}]+try \{[^}]+const res = await api\.post\(\'\/excel\/preview\', formData\);'

new_code = '''const handlePreviewSheet = async (sheetName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sheet_name', sheetName);

    setLoading(true);
    try {
      const res = await api.post('/excel/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });'''

# Buscar la línea del api.post para preview
content = re.sub(
    r"(const res = await api\.post\('/excel/preview', formData)\);",
    r"\1, {\n        headers: { 'Content-Type': 'multipart/form-data' }\n      });",
    content
)

with open('ExcelImport.jsx', 'w') as f:
    f.write(content)

print("✅ Headers agregados a handlePreviewSheet")
