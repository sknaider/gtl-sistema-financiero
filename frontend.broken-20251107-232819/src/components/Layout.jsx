import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, TrendingUp, TrendingDown, 
  Calculator, CreditCard, BarChart3, FileUp, LogOut, User, ChevronDown
} from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('NOVIEMBRE');

  const menuItems = [
    { path: '/sistema', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/sistema/empresas', icon: Building2, label: 'Empresas' },
    { path: '/sistema/ingresos', icon: TrendingUp, label: 'Ingresos' },
    { path: '/sistema/costos', icon: TrendingDown, label: 'Costos' },
    { path: '/sistema/utilidades', icon: Calculator, label: 'Utilidades' },
    { path: '/sistema/pagos', icon: CreditCard, label: 'Pagos' },
    { path: '/sistema/graficos', icon: BarChart3, label: 'Gráficos' },
    { path: '/sistema/excel-import', icon: FileUp, label: 'Importar Excel' },
  ];

  const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">GTL</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">GTL CONSULTING SACS</h1>
              <p className="text-xs text-gray-400">Sistema Financiero</p>
            </div>
          </div>
        </div>

        {/* Selector de mes */}
        <div className="px-4 mb-4">
          <label className="text-xs text-gray-400 mb-2 block">MES ACTIVO</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm"
          >
            {meses.map(mes => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </div>

        {/* Menú */}
        <nav className="flex-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="p-4 border-t border-gray-800">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition"
            >
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{user?.nombre}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.rol}</p>
              </div>
              <ChevronDown size={16} className={`transition ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-700 transition text-red-400"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
