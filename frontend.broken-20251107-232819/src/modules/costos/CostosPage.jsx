import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { costosService } from '../../services/costosService';
import { TIPOS_COSTO } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CostosPage = () => {
  const { mesSeleccionado } = useApp();
  const [costos, setCostos] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: '',
    tipo: 'OPERATIVO',
    mes: mesSeleccionado
  });
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [costosData, kpisData] = await Promise.all([
        costosService.getAll(mesSeleccionado),
        costosService.getKPIs(mesSeleccionado)
      ]);
      setCostos(costosData);
      setKpis(kpisData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await costosService.create({
        ...formData,
        mes: mesSeleccionado,
        monto: parseFloat(formData.monto)
      });
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        monto: '',
        tipo: 'OPERATIVO',
        mes: mesSeleccionado
      });
      
      await loadData();
      alert('Costo creado exitosamente');
    } catch (error) {
      console.error('Error creando costo:', error);
      alert('Error al crear el costo');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este costo?')) return;
    
    try {
      await costosService.delete(id);
      await loadData();
      alert('Costo eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando costo:', error);
      alert('Error al eliminar el costo');
    }
  };
  
  const columns = [
    { key: 'numero', label: 'N°', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true, render: (row) => formatDate(row.fecha) },
    { key: 'concepto', label: 'Concepto', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'monto', label: 'Monto', sortable: true, render: (row) => formatCurrency(row.monto, 'PEN') },
    { 
      key: 'actions', 
      label: 'Acciones',
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={() => handleDelete(row.id)}
        >
          Eliminar
        </Button>
      )
    }
  ];
  
  if (loading) return <Loading fullScreen text="Cargando costos..." />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Costos</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Costo Mensual</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(kpis.costo_mensual, 'PEN')}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Transacciones</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {kpis.num_transacciones}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Costo Promedio</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrency(kpis.costo_promedio, 'PEN')}
              </p>
            </div>
          </Card>
        </div>
      )}
      
      {/* Formulario */}
      <Card title="Nuevo Costo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
            />
            
            <Select
              label="Tipo"
              required
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              options={TIPOS_COSTO.map(tipo => ({ value: tipo, label: tipo }))}
            />
            
            <Input
              label="Concepto"
              required
              value={formData.concepto}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
              placeholder="Descripción del gasto..."
              className="md:col-span-2"
            />
            
            <Input
              label="Monto (PEN)"
              type="number"
              step="0.01"
              required
              value={formData.monto}
              onChange={(e) => setFormData({...formData, monto: e.target.value})}
              placeholder="0.00"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormData({
                fecha: new Date().toISOString().split('T')[0],
                concepto: '',
                monto: '',
                tipo: 'OPERATIVO',
                mes: mesSeleccionado
              })}
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Plus}
              loading={submitting}
            >
              Agregar Costo
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Tabla */}
      <Card title={`Costos de ${mesSeleccionado}`} subtitle={`${costos.length} registros`}>
        <Table columns={columns} data={costos} />
      </Card>
    </div>
  );
};

export default CostosPage;
