import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { mesSeleccionado } = useApp();
  
  const modules = [
    {
      title: 'INGRESOS',
      icon: TrendingUp,
      path: '/ingresos',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      description: 'Registrar ingresos del mes'
    },
    {
      title: 'COSTOS',
      icon: TrendingDown,
      path: '/costos',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      description: 'Registrar costos operativos'
    },
    {
      title: 'UTILIDADES',
      icon: Calculator,
      path: '/utilidades',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      description: 'Ver rentabilidad del mes'
    },
    {
      title: 'PAGOS',
      icon: CreditCard,
      path: '/pagos',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      description: 'Gestionar cuentas por cobrar'
    },
    {
      title: 'GRÁFICOS',
      icon: BarChart3,
      path: '/graficos',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      description: 'Visualizar reportes'
    }
  ];
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gtl-red rounded-full mb-4">
          <span className="text-white font-bold text-3xl">GTL</span>
        </div>
        <h1 className="text-3xl font-bold text-gtl-gray mb-2">
          Sistema de Control de Costos e Ingresos
        </h1>
        <p className="text-gray-600">GTL Consulting SACS - Operador Logístico</p>
        <div className="mt-4 inline-block bg-gtl-red text-white px-4 py-2 rounded-lg font-medium">
          Mes Activo: {mesSeleccionado}
        </div>
      </div>
      
      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {modules.map((module) => (
          <button
            key={module.path}
            onClick={() => navigate(module.path)}
            className={`
              ${module.color} ${module.hoverColor}
              text-white rounded-xl shadow-lg p-8
              transform transition-all duration-200
              hover:scale-105 hover:shadow-2xl
              focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-gray-400
            `}
          >
            <div className="flex flex-col items-center space-y-4">
              <module.icon className="h-16 w-16" />
              <h3 className="text-2xl font-bold">{module.title}</h3>
              <p className="text-sm opacity-90">{module.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 pt-8">
        <p>Accede a cualquier módulo para comenzar a trabajar</p>
      </div>
    </div>
  );
};

export default Dashboard;
