import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardEjecutivo = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState('OCTUBRE');

  useEffect(() => {
    cargarKPIs();
  }, [mes]);

  const cargarKPIs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/sistema/api/dashboard/kpis/${mes}`);
      setKpis(response.data);
      setError(null);
    } catch (error) {
      console.error('Error cargando KPIs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gtl-red"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-12">
        <p>Error cargando datos: {error}</p>
        <button onClick={cargarKPIs} className="mt-4 px-4 py-2 bg-gtl-red text-white rounded-lg">
          Reintentar
        </button>
      </div>
    );
  }

  if (!kpis || !kpis.mes_actual) {
    return (
      <div className="text-center text-gray-500 py-12">
        No hay datos disponibles para {mes}
      </div>
    );
  }

  const formatMoney = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const KPICard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {change !== undefined && change !== 0 && (
          <span className={`text-sm font-medium flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );

  const AlertaBanner = ({ tipo, mensaje }) => {
    const colores = {
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      danger: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    return (
      <div className={`border-l-4 p-4 rounded ${colores[tipo] || colores.info}`}>
        <p className="text-sm font-medium">{mensaje}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-gray-600 mt-1">Métricas financieras - {mes}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {kpis.alertas && kpis.alertas.length > 0 && (
        <div className="space-y-2">
          {kpis.alertas.map((alerta, idx) => (
            <AlertaBanner key={idx} tipo={alerta.tipo} mensaje={alerta.mensaje} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Utilidad Neta"
          value={formatMoney(kpis.mes_actual.utilidad_neta)}
          change={kpis.mes_actual.cambio_utilidad}
          icon={DollarSign}
          color="text-green-600"
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatMoney(kpis.mes_actual.ingresos)}
          change={kpis.mes_actual.cambio_ingresos}
          icon={TrendingUp}
          color="text-blue-600"
        />
        <KPICard
          title="Costos del Mes"
          value={formatMoney(kpis.mes_actual.costos)}
          change={kpis.mes_actual.cambio_costos}
          icon={TrendingDown}
          color="text-red-600"
        />
        <KPICard
          title="Margen de Utilidad"
          value={`${kpis.mes_actual.margen.toFixed(1)}%`}
          icon={DollarSign}
          color="text-purple-600"
        />
        <KPICard
          title="Cuentas por Cobrar"
          value={`${kpis.cuentas_por_cobrar.pendientes} cuentas`}
          icon={AlertTriangle}
          color="text-orange-600"
        />
        <KPICard
          title="Tipo de Cambio"
          value={`S/ ${kpis.tipo_cambio.valor}`}
          icon={DollarSign}
          color="text-indigo-600"
        />
      </div>

      {kpis.tendencia_3_meses && kpis.tendencia_3_meses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tendencia Últimos Meses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={kpis.tendencia_3_meses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => formatMoney(value)} />
              <Legend />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
              <Bar dataKey="costos" fill="#ef4444" name="Costos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {kpis.top_clientes && kpis.top_clientes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top 5 Clientes del Mes</h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {kpis.top_clientes.map((cliente, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gtl-red text-white font-bold text-sm">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-900 text-sm">{cliente.nombre}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatMoney(cliente.monto)}</p>
                  <p className="text-sm text-gray-600">{cliente.porcentaje}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardEjecutivo;
