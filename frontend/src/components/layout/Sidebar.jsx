import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  CreditCard,
  BarChart3,
  Building2,
  X
} from 'lucide-react'
import { Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { MESES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { mesSeleccionado, setMesSeleccionado } = useApp();
  
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/clientes', icon: Building2, label: 'Clientes' },
    { path: '/ingresos', icon: TrendingUp, label: 'Ingresos' },
    { path: '/costos', icon: TrendingDown, label: 'Costos' },
    { path: '/tipos-costo', icon: Settings, label: 'Tipos de Costo' },
    { path: '/utilidades', icon: Calculator, label: 'Utilidades' },
    { path: '/pagos', icon: CreditCard, label: 'Pagos' },
    { path: '/graficos', icon: BarChart3, label: 'Gráficos' },
  ];
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gtl-gray transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Close button (mobile) */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-700">
            <span className="text-white font-semibold">Menú</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Selector de mes */}
          <div className="p-4 border-b border-gray-700">
            <label className="block text-xs font-medium text-gray-400 mb-2">
              MES ACTIVO
            </label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gtl-red"
            >
              {MESES.map((mes) => (
                <option key={mes} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-gtl-red text-white border-l-4 border-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              <p>Sistema Financiero v1.0</p>
              <p className="mt-1">© 2025 GTL Consulting</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
