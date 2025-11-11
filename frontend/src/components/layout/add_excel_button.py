import re

with open('Sidebar.jsx', 'r') as f:
    content = f.read()

# Buscar el último item (Gráficos) y agregar después
new_item = '''        <Link
          to="/excel-import"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
            location.pathname === '/excel-import'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <FileSpreadsheet size={20} />
          <span>Importar Excel</span>
        </Link>'''

# Buscar el cierre del contenedor de links y agregar antes
content = re.sub(
    r'(</Link>\s*</nav>)',
    new_item + '\n      </nav>',
    content
)

with open('Sidebar.jsx', 'w') as f:
    f.write(content)

print("✅ Botón agregado al Sidebar")
