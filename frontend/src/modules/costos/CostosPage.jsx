import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { costosService } from '../../services/costosService';
import { tiposCostoService } from '../../services/tiposCostoService';
import { TIPOS_COSTO, MONEDAS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const CostosPage = () => {
  const { mesSeleccionado } = useApp();
  const [costos, setCostos] = useState([]);
  const [tiposCosto, setTiposCosto] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: '',
    tipo: 'OPERATIVO',
    moneda: 'PEN',
    awb: '',
    mes: mesSeleccionado
  });
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [costosData, kpisData, tiposData] = await Promise.all([
        costosService.getAll(mesSeleccionado),
        costosService.getKpis(mesSeleccionado),
        tiposCostoService.getAll()
      ]);
      setCostos(costosData);
      setKpis(kpisData);
      setTiposCosto(tiposData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };
  
  const calcularKPIsPorMoneda = () => {
    const costosUSD = costos.filter(c => c.moneda === 'USD');
    const costosPEN = costos.filter(c => c.moneda === 'PEN');
    
    const totalUSD = costosUSD.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
    const totalPEN = costosPEN.reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
    
    return {
      usd: {
        total: totalUSD,
        transacciones: costosUSD.length,
        promedio: costosUSD.length > 0 ? totalUSD / costosUSD.length : 0
      },
      pen: {
        total: totalPEN,
        transacciones: costosPEN.length,
        promedio: costosPEN.length > 0 ? totalPEN / costosPEN.length : 0
      }
    };
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const costoData = {
        ...formData,
        mes: mesSeleccionado,
        monto: parseFloat(formData.monto)
      };

      if (editingId) {
        await costosService.update(editingId, costoData);
        alert('Costo actualizado exitosamente');
        setEditingId(null);
      } else {
        await costosService.create(costoData);
        alert('Costo creado exitosamente');
      }
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        monto: '',
        tipo: 'OPERATIVO',
        moneda: 'PEN',
        awb: '',
        mes: mesSeleccionado
      });
      
      await loadData();
    } catch (error) {
      console.error('Error al guardar el costo:', error);
      alert('Error al guardar el costo');
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

  const handleEdit = (costo) => {
    setFormData({
      fecha: costo.fecha,
      concepto: costo.concepto,
      monto: costo.monto,
      tipo: costo.tipo,
      moneda: costo.moneda,
      awb: costo.awb || '',
      mes: costo.mes
    });
    setEditingId(costo.id);
  };
  
  const columns = [
    { key: 'numero', label: 'N°', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true, render: (row) => formatDate(row.fecha) },
    { key: 'concepto', label: 'Concepto', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'moneda', label: 'Moneda', sortable: true },
    { key: 'awb', label: 'AWB', sortable: true },
    { key: 'monto', label: 'Monto', sortable: true, render: (row) => formatCurrency(row.monto, row.moneda || 'PEN') },
    { 
      key: 'actions', 
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="sm"
            icon={Edit}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
          >
            Eliminar
          </Button>
        </div>
      )
    }
  ];
  
  if (loading) return <Loading fullScreen text="Cargando costos..." />;
  
  const kpisPorMoneda = calcularKPIsPorMoneda();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Costos</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              OPERACIONES EN USD
            </h3>
            
            <div>
              <p className="text-sm text-gray-600">Total:</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(kpisPorMoneda.usd.total, 'USD')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-gray-600">Transacciones:</p>
                <p className="text-xl font-semibold text-gray-800">
                  {kpisPorMoneda.usd.transacciones}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ticket Promedio:</p>
                <p className="text-xl font-semibold text-gray-800">
                  {formatCurrency(kpisPorMoneda.usd.promedio, 'USD')}
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
              OPERACIONES EN PEN
            </h3>
            
            <div>
              <p className="text-sm text-gray-600">Total:</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(kpisPorMoneda.pen.total, 'PEN')}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-sm text-gray-600">Transacciones:</p>
                <p className="text-xl font-semibold text-gray-800">
                  {kpisPorMoneda.pen.transacciones}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ticket Promedio:</p>
                <p className="text-xl font-semibold text-gray-800">
                  {formatCurrency(kpisPorMoneda.pen.promedio, 'PEN')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
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
              options={tiposCosto.map(tipo => ({ value: tipo.nombre, label: tipo.nombre }))}
            />
            
            <Input
              label="Concepto"
              required
              value={formData.concepto}
              onChange={(e) => setFormData({...formData, concepto: e.target.value})}
              placeholder="Descripción del gasto..."
            />
            
            <Input
              label="AWB"
              value={formData.awb}
              onChange={(e) => setFormData({...formData, awb: e.target.value})}
              placeholder="074 7014 xxxx"
            />
            
            <Select
              label="Moneda"
              required
              value={formData.moneda}
              onChange={(e) => setFormData({...formData, moneda: e.target.value})}
              options={MONEDAS}
            />
            
            <Input
              label="Monto"
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
              onClick={() => {
                setFormData({
                  fecha: new Date().toISOString().split('T')[0],
                  concepto: '',
                  monto: '',
                  tipo: 'OPERATIVO',
                  moneda: 'PEN',
                  awb: '',
                  mes: mesSeleccionado
                });
                setEditingId(null);
              }}
            >
              Limpiar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Plus}
              loading={submitting}
            >
              {editingId ? 'Actualizar Costo' : 'Agregar Costo'}
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title={`Costos de ${mesSeleccionado}`} subtitle={`${costos.length} registros`}>
        <Table columns={columns} data={costos} />
      </Card>
    </div>
  );
};

export default CostosPage;
