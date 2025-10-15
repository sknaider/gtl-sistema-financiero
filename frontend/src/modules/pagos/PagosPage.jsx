import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import { useApp } from '../../context/AppContext';
import { pagosService } from '../../services/pagosService';
import { formatDate } from '../../utils/formatters';

const PagosPage = () => {
  const { mesSeleccionado } = useApp();
  const [pagos, setPagos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  
  useEffect(() => {
    loadData();
  }, [mesSeleccionado, filtroEstado]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [pagosData, statsData] = await Promise.all([
        pagosService.getAll(mesSeleccionado, filtroEstado || null),
        pagosService.getEstadisticas(mesSeleccionado)
      ]);
      setPagos(pagosData);
      setEstadisticas(statsData);
    } catch (error) {
      console.error('Error cargando pagos:', error);
      alert('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await pagosService.updateEstado(id, nuevoEstado);
      await loadData();
      alert(`Estado actualizado a: ${nuevoEstado}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    }
  };
  
  const columns = [
    { key: 'empresa_nombre', label: 'Empresa', sortable: true },
    { key: 'awb', label: 'AWB', sortable: true },
    { 
      key: 'estado', 
      label: 'Estado', 
      sortable: true,
      render: (row) => (
        <span className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${row.estado === 'PAGADO' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
          }
        `}>
          {row.estado}
        </span>
      )
    },
    { 
      key: 'fecha_pago', 
      label: 'Fecha Pago', 
      sortable: true,
      render: (row) => row.fecha_pago ? formatDate(row.fecha_pago) : '-'
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <div className="flex space-x-2">
          {row.estado === 'NO PAGADO' ? (
            <Button
              variant="success"
              size="sm"
              icon={Check}
              onClick={() => handleCambiarEstado(row.id, 'PAGADO')}
            >
              Marcar Pagado
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={() => handleCambiarEstado(row.id, 'NO PAGADO')}
            >
              Marcar No Pagado
            </Button>
          )}
        </div>
      )
    }
  ];
  
  if (loading) return <Loading fullScreen text="Cargando pagos..." />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gtl-gray">Módulo de Pagos</h1>
        <div className="text-sm text-gray-600">
          Mes: <span className="font-semibold">{mesSeleccionado}</span>
        </div>
      </div>
      
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Cuentas</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {estadisticas.total}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {estadisticas.pagados}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {estadisticas.no_pagados}
              </p>
            </div>
          </Card>
        </div>
      )}
      
      {/* Filtros */}
      <Card>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <div className="flex space-x-2">
            <Button
              variant={filtroEstado === '' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFiltroEstado('')}
            >
              Todos
            </Button>
            <Button
              variant={filtroEstado === 'NO PAGADO' ? 'danger' : 'secondary'}
              size="sm"
              onClick={() => setFiltroEstado('NO PAGADO')}
            >
              No Pagado
            </Button>
            <Button
              variant={filtroEstado === 'PAGADO' ? 'success' : 'secondary'}
              size="sm"
              onClick={() => setFiltroEstado('PAGADO')}
            >
              Pagado
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Tabla */}
      <Card 
        title={`Cuentas por Cobrar - ${mesSeleccionado}`} 
        subtitle={`${pagos.length} registros`}
      >
        <Table columns={columns} data={pagos} />
      </Card>
    </div>
  );
};

export default PagosPage;
