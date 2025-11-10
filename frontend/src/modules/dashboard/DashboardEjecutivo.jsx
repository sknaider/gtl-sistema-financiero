import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar, Users, ChevronDown, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardEjecutivo = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mes, setMes] = useState('OCTUBRE');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

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

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await axios.post(`/sistema/api/reset/backup-and-reset/${mes}`);
      alert(`✅ Datos reseteados correctamente\n\nBackup creado: ${response.data.backup_file}\n\nRegistros eliminados:\n- ${response.data.deleted.ingresos} ingresos\n- ${response.data.deleted.costos} costos\n- ${response.data.deleted.pagos} pagos`);
      setShowConfirm(false);
      cargarKPIs();
    } catch (error) {
      alert('❌ Error al resetear datos: ' + error.message);
    } finally {
      setResetting(false);
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
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">⚠️ Confirmar Reseteo</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de resetear todos los datos de <strong>{mes}</strong>?
              <br /><br />
              Se creará un backup automático antes de eliminar:
              <br />• Todos los ingresos
              <br />• Todos los costos
              <br />• Todos los pagos
              <br />• Las utilidades calculadas
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={resetting}
              >
                {resetting ? 'Reseteando...' : 'Sí, Resetear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Opciones"
              >
                <ChevronDown className="h-5 w-5 text-gray-600" />
              </button>
              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <button 
                      onClick={() => { 
                        setShowConfirm(true); 
                        setShowDropdown(false); 
                      }} 
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 font-medium rounded-lg transition-colors"
                    >
                      <RotateCcw className="h-5 w-5" />
                      <div>
                        <div>Resetear Datos</div>
                        <div className="text-xs text-gray-500 font-normal">Crea backup automático</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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

      {kpis.ingresos_por_moneda && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
              INGRESOS EN USD
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${kpis.ingresos_por_moneda.usd?.total?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transacciones:</span>
                <span className="text-xl font-semibold text-gray-800">
                  {kpis.ingresos_por_moneda.usd?.transacciones || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-600">Ticket Promedio:</span>
                <span className="text-lg font-medium text-indigo-600">
                  ${kpis.ingresos_por_moneda.usd?.ticket_promedio?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
              INGRESOS EN PEN
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  S/ {kpis.ingresos_por_moneda.pen?.total?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transacciones:</span>
                <span className="text-xl font-semibold text-gray-800">
                  {kpis.ingresos_por_moneda.pen?.transacciones || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-gray-600">Ticket Promedio:</span>
                <span className="text-lg font-medium text-purple-600">
                  S/ {kpis.ingresos_por_moneda.pen?.ticket_promedio?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Utilidad Neta"
          value={formatMoney(kpis.mes_actual.utilidad_neta)}
          change={kpis.mes_actual.cambio_utilidad}
          icon={DollarSign}
          color="text-green-600"
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
