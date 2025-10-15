import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { utilidadesService } from '../../services/utilidadesService';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const UtilidadesPage = () => {
  const { mesSeleccionado } = useApp();
  const [utilidad, setUtilidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await utilidadesService.getByMes(mesSeleccionado);
      setUtilidad(data);
    } catch (error) {
      console.error('Error cargando utilidad:', error);
      alert('Error al cargar la utilidad');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRecalcular = async () => {
    setRecalculating(true);
    try {
      await utilidadesService.recalcular(mesSeleccionado);
      await loadData();
      alert('Utilidad recalculada exitosamente');
    } catch (error) {
      console.error('Error recalculando:', error);
      alert('Error al recalcular la utilidad');
    } finally {
      setRecalculating(false);
    }
  };
  
  if (loading) return <Loading fullScreen text="Cargando utilidades..." />;
  
  const utilidadNeta = utilidad?.utilidad_neta || 0;
  const margen = utilidad?.margen || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Utilidades</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      {/* Utilidad Principal */}
      <Card>
        <div className="text-center py-8">
          <p className="text-xl text-gray-600 mb-4">Utilidad de {mesSeleccionado}</p>
          <p className={`text-6xl font-bold ${utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(utilidadNeta, 'PEN')}
          </p>
          <p className="text-lg text-gray-500 mt-4">
            Margen: {formatPercentage(margen)}
          </p>
        </div>
      </Card>
      
      {/* Detalle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Ingresos">
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(utilidad?.total_ingresos || 0, 'PEN')}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total de ingresos del mes</p>
          </div>
        </Card>
        
        <Card title="Costos">
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-red-600">
              {formatCurrency(utilidad?.total_costos || 0, 'PEN')}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total de costos del mes</p>
          </div>
        </Card>
      </div>
      
      {/* Fórmula */}
      <Card title="Cálculo">
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-lg text-gray-700">
            <span className="font-semibold">Utilidad</span> = 
            <span className="text-green-600 font-semibold"> Ingresos</span> - 
            <span className="text-red-600 font-semibold"> Costos</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Esta utilidad se recalcula automáticamente al agregar ingresos o costos
          </p>
        </div>
      </Card>
      
      {/* Botón recalcular */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={handleRecalcular}
          loading={recalculating}
        >
          Recalcular Manualmente
        </Button>
      </div>
    </div>
  );
};

export default UtilidadesPage;
