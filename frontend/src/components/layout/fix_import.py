with open('Sidebar.jsx', 'r') as f:
    lines = f.readlines()

# Encontrar y arreglar los imports de lucide-react
fixed_lines = []
import_found = False

for line in lines:
    if '} FileSpreadsheet, from' in line or 'Settings } FileSpreadsheet' in line:
        # Línea rota, saltarla
        continue
    elif 'from \'lucide-react\'' in line and not import_found:
        # Arreglar el import
        if 'FileSpreadsheet' not in line:
            line = line.replace('from \'lucide-react\'', ', FileSpreadsheet from \'lucide-react\'')
        import_found = True
    fixed_lines.append(line)

with open('Sidebar.jsx', 'w') as f:
    f.writelines(fixed_lines)

print("✅ Import arreglado")
