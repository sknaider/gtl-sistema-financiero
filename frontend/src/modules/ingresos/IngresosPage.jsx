import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { ingresosService } from '../../services/ingresosService';
import { clientesService } from '../../services/clientesService';
import { MONEDAS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const IngresosPage = () => {
  const { mesSeleccionado, añoSeleccionado } = useApp();
  const [ingresos, setIngresos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cliente_id: '',
    descripcion: '',
    awb: '',
    moneda: 'USD',
    monto: '',
    mes: mesSeleccionado
  });
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado, añoSeleccionado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [ingresosData, clientesData, kpisData] = await Promise.all([
        ingresosService.getAll(mesSeleccionado, añoSeleccionado),
        clientesService.getAll(),
        ingresosService.getKpis(mesSeleccionado, añoSeleccionado)
      ]);
      setIngresos(ingresosData);
      setClientes(clientesData);
      const transformedKpis = {
        usd: {
          total: kpisData.total_ingresos_usd || 0,
          transacciones: kpisData.cantidad_transacciones || 0,
          ticket_promedio: kpisData.ticket_promedio_usd || 0
        },
        pen: {
          total: kpisData.total_ingresos_pen || 0,
          transacciones: kpisData.cantidad_transacciones || 0,
          ticket_promedio: kpisData.ticket_promedio_pen || 0
        }
      };
      setKpis(transformedKpis);
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
      const ingresoData = {
        ...formData,
        mes: mesSeleccionado,
        monto: parseFloat(formData.monto),
        cliente_id: parseInt(formData.cliente_id)
      };

      if (editingId) {
        await ingresosService.update(editingId, ingresoData);
        alert('Ingreso actualizado exitosamente');
        setEditingId(null);
      } else {
        await ingresosService.create(ingresoData);
        alert('Ingreso creado exitosamente');
      }
      
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        cliente_id: '',
        descripcion: '',
        awb: '',
        moneda: 'USD',
        monto: '',
        mes: mesSeleccionado
      });
      
      await loadData();
    } catch (error) {
      console.error('Error al guardar el ingreso:', error);
      alert('Error al guardar el ingreso');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este ingreso?')) return;
    
    try {
      await ingresosService.delete(id);
      await loadData();
      alert('Ingreso eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando ingreso:', error);
      alert('Error al eliminar el ingreso');
    }
  };

  const handleEdit = (ingreso) => {
    setFormData({
      fecha: ingreso.fecha,
      cliente_id: ingreso.cliente_id,
      descripcion: ingreso.descripcion,
      awb: ingreso.awb,
      moneda: ingreso.moneda,
      monto: ingreso.monto,
      mes: ingreso.mes
    });
    setEditingId(ingreso.id);
  };
  
  const columns = [
    { key: 'numero', label: 'N°', sortable: true },
    { key: 'fecha', label: 'Fecha', sortable: true, render: (row) => formatDate(row.fecha) },
    { key: 'cliente', label: 'Cliente', sortable: true, render: (row) => clientes.find(c => c.id === row.cliente_id)?.nombre || '-' },
    { key: 'descripcion', label: 'Descripción', sortable: true },
    { key: 'awb', label: 'AWB', sortable: true },
    { key: 'moneda', label: 'Moneda', sortable: true },
    { key: 'monto', label: 'Monto', sortable: true, render: (row) => formatCurrency(row.monto, row.moneda) },
    { key: 'monto_pen', label: 'Monto PEN', sortable: true, render: (row) => formatCurrency(row.monto_pen, 'PEN') },
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
  
  if (loading) return <Loading fullScreen text="Cargando ingresos..." />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Ingresos</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
                OPERACIONES EN USD
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${kpis.usd?.total?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transacciones:</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {kpis.usd?.transacciones || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Ticket Promedio:</span>
                  <span className="text-lg font-medium text-indigo-600">
                    ${kpis.usd?.ticket_promedio?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
                OPERACIONES EN PEN
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    S/ {kpis.pen?.total?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transacciones:</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {kpis.pen?.transacciones || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-gray-600">Ticket Promedio:</span>
                  <span className="text-lg font-medium text-purple-600">
                    S/ {kpis.pen?.ticket_promedio?.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <Card title="Nuevo Ingreso">
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
              label="Cliente"
              required
              value={formData.cliente_id}
              onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
              options={clientes.map(cli => ({ value: cli.id, label: cli.nombre }))}
            />
            
            <Input
              label="Descripción"
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Servicio logístico..."
            />
            
            <Input
              label="AWB"
              required
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
                  cliente_id: '',
                  descripcion: '',
                  awb: '',
                  moneda: 'USD',
                  monto: '',
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
              {editingId ? 'Actualizar Ingreso' : 'Agregar Ingreso'}
            </Button>
          </div>
        </form>
      </Card>
      
      <Card title={`Ingresos de ${mesSeleccionado}`} subtitle={`${ingresos.length} registros`}>
        <Table columns={columns} data={ingresos} />
      </Card>
    </div>
  );
};

export default IngresosPage;
