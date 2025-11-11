import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Calculator,
  CreditCard,
  BarChart3,
  Users,
  Building2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MESES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { mesSeleccionado, setMesSeleccionado } = useApp();
  
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/clientes', icon: Building2, label: 'Clientes' },
    { path: '/ingresos', icon: TrendingUp, label: 'Ingresos' },
    { path: '/costos', icon: TrendingDown, label: 'Costos' },
    { path: '/tipos-costo', icon: Calculator, label: 'Tipos de Costo' },
    { path: '/utilidades', icon: Calculator, label: 'Utilidades' },
    { path: '/pagos', icon: CreditCard, label: 'Pagos' },
    { path: '/graficos', icon: BarChart3, label: 'Gráficos' },
    { path: '/excel-import', icon: FileSpreadsheet, label: 'Importar Excel' }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white w-64 transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">MES ACTIVO</h2>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {MESES.map((mes) => (
              <option key={mes} value={mes}>
                {mes}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
