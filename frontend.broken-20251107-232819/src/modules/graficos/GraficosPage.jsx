import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { ingresosService } from '../../services/ingresosService';
import { costosService } from '../../services/costosService';
import { formatCurrency } from '../../utils/formatters';

const COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
  '#16A34A', '#059669', '#0891B2', '#0284C7', '#2563EB'
];

const GraficosPage = () => {
  const { mesSeleccionado } = useApp();
  const [ingresos, setIngresos] = useState([]);
  const [costos, setCostos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [ingresosData, costosData] = await Promise.all([
        ingresosService.getAll(mesSeleccionado),
        costosService.getAll(mesSeleccionado)
      ]);
      setIngresos(ingresosData);
      setCostos(costosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los gráficos');
    } finally {
      setLoading(false);
    }
  };
  
  // Agrupar ingresos por cliente
  const ingresosAgrupados = ingresos.reduce((acc, ingreso) => {
    const empresaNombre = ingreso.empresa_nombre || 'Sin empresa';
    if (!acc[empresaNombre]) {
      acc[empresaNombre] = 0;
    }
    acc[empresaNombre] += parseFloat(ingreso.monto_pen || 0);
    return acc;
  }, {});
  
  const dataIngresos = Object.entries(ingresosAgrupados)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10
  
  // Agrupar costos por tipo
  const costosAgrupados = costos.reduce((acc, costo) => {
    const tipo = costo.tipo || 'OTROS';
    if (!acc[tipo]) {
      acc[tipo] = 0;
    }
    acc[tipo] += parseFloat(costo.monto || 0);
    return acc;
  }, {});
  
  const dataCostos = Object.entries(costosAgrupados)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const totalIngresos = dataIngresos.reduce((sum, item) => sum + item.value, 0);
  const totalCostos = dataCostos.reduce((sum, item) => sum + item.value, 0);
  
  if (loading) return <Loading fullScreen text="Cargando gráficos..." />;
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{payload[0].name}</p>
          <p className="text-gtl-red font-semibold">
            {formatCurrency(payload[0].value, 'PEN')}
          </p>
          <p className="text-xs text-gray-500">
            {((payload[0].value / (payload[0].payload.total || 1)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Gráficos</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Ingresos</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIngresos, 'PEN')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dataIngresos.length} categorías
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Costos</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(totalCostos, 'PEN')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dataCostos.length} categorías
            </p>
          </div>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ingresos por Cliente" subtitle={`Top 10 - ${mesSeleccionado}`}>
          {dataIngresos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay datos de ingresos para mostrar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dataIngresos.map(d => ({...d, total: totalIngresos}))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataIngresos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-xs">
                      {value.length > 30 ? value.substring(0, 30) + '...' : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
        
        <Card title="Costos por Tipo" subtitle={mesSeleccionado}>
          {dataCostos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay datos de costos para mostrar
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={dataCostos.map(d => ({...d, total: totalCostos}))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataCostos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      
      {/* Leyenda de colores */}
      <Card title="Categorías">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...dataIngresos, ...dataCostos].slice(0, 10).map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-gray-700 truncate">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default GraficosPage;
