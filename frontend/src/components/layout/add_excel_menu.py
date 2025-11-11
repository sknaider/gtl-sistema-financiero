import re

with open('Sidebar.jsx', 'r') as f:
    content = f.read()

# Buscar el array menuItems y agregar el nuevo item
# Buscar el último item antes del cierre del array
pattern = r"(\{ path: '/graficos', icon: BarChart3, label: 'Gráficos' \})"
replacement = r"\1,\n    { path: '/excel-import', icon: FileSpreadsheet, label: 'Importar Excel' }"

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    with open('Sidebar.jsx', 'w') as f:
        f.write(content)
    print("✅ Botón agregado a menuItems")
else:
    print("⚠️ No se encontró el patrón, buscando alternativa...")
    # Buscar cualquier cierre de array menuItems
    pattern2 = r"(const menuItems = \[[\s\S]*?\})\s*\]"
    if re.search(pattern2, content):
        content = re.sub(pattern2, r"\1,\n    { path: '/excel-import', icon: FileSpreadsheet, label: 'Importar Excel' }\n  ]", content)
        with open('Sidebar.jsx', 'w') as f:
            f.write(content)
        print("✅ Botón agregado (método alternativo)")
