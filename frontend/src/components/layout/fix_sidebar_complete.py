# Leer el archivo
with open('Sidebar.jsx', 'r') as f:
    content = f.read()

# Si el archivo está muy roto, mejor recrear el import
# Buscar donde empieza el import de lucide-react
import_start = content.find("import {")
if import_start != -1:
    # Extraer todo hasta el primer import que funciona
    # y reconstruir correctamente
    
    # Header correcto
    header = '''import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Calculator,
  CreditCard,
  BarChart3,
  Users,
  Settings,
  Building2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MESES } from '../../utils/constants';
'''
    
    # Encontrar donde empieza el export
    export_start = content.find('export default')
    if export_start != -1:
        # Tomar desde export hasta el final
        rest = content[export_start:]
        
        # Unir header + resto
        fixed = header + '\n' + rest
        
        with open('Sidebar.jsx', 'w') as f:
            f.write(fixed)
        
        print("✅ Archivo reconstruido")
    else:
        print("❌ No se encontró export")
else:
    print("❌ Archivo muy corrupto")
