import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Search, XCircle, Clock, Filter as FilterIcon, SlidersHorizontal } from 'lucide-react';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import Table from '../../components/common/Table';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';

const PagosPage = () => {
  const { mesSeleccionado } = useApp();
  const [pagos, setPagos] = useState([]);
  const [filteredPagos, setFilteredPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  
  // 🔍 SEARCH FEATURES
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchPagos(searchQuery.trim() !== '');
    fetchEstadisticas();
  }, [mesSeleccionado, searchQuery]);

  useEffect(() => {
    loadSearchHistory();
    
    // Keyboard shortcut: "/" to focus search
    const handleKeyPress = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        clearAllFilters();
        setShowAdvancedSearch(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    filterPagos();
  }, [pagos, estadoFilter, searchQuery]);

  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem('pagos_search_history') || '[]');
    setSearchHistory(history.slice(0, 5));
  };

  const saveToHistory = (query) => {
    if (!query.trim() || searchHistory.includes(query)) return;
    const newHistory = [query, ...searchHistory].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('pagos_search_history', JSON.stringify(newHistory));
  };

  const fetchPagos = async (searchAll = false) => {
    try {
      setLoading(true);
      let url = `/pagos/?mes=${mesSeleccionado}`;
      if (searchAll || searchQuery.trim()) {
        url = `/pagos/?search_all=true`;
      }
      const response = await api.get(url);
      setPagos(response.data);
    } catch (error) {
      console.error('Error fetching pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await api.get(`/pagos/mes/${mesSeleccionado}/estadisticas`);
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error fetching estadisticas:', error);
    }
  };

  const filterPagos = () => {
    let filtered = [...pagos];
    const filters = [];

    // Filter by estado
    if (estadoFilter !== 'TODOS') {
      filtered = filtered.filter(p => p.estado === estadoFilter);
      filters.push({ type: 'estado', label: `Estado: ${estadoFilter}`, value: estadoFilter });
    }

    // 🔍 Multi-field search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.awb && p.awb.toLowerCase().includes(query)) ||
        (p.nombre_empresa && p.nombre_empresa.toLowerCase().includes(query))
      );
      filters.push({ type: 'search', label: `Búsqueda: "${searchQuery}"`, value: searchQuery });
      saveToHistory(searchQuery);
    }

    setActiveFilters(filters);
    setFilteredPagos(filtered);
  };

  const handleCambiarEstado = async (pagoId, nuevoEstado) => {
    try {
      const payload = {
        estado: nuevoEstado,
        fecha_pago: nuevoEstado === 'PAGADO' ? new Date().toISOString().split('T')[0] : null
      };
      await api.put(`/pagos/${pagoId}`, payload);
      fetchPagos();
      fetchEstadisticas();
    } catch (error) {
      console.error('Error updating pago:', error);
    }
  };

  const removeFilter = (filterType) => {
    if (filterType === 'estado') setEstadoFilter('TODOS');
    if (filterType === 'search') setSearchQuery('');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setEstadoFilter('TODOS');
  };

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-1">{part}</mark>
        : part
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const columns = [
    { 
      key: 'nombre_empresa', 
      label: 'Empresa', 
      sortable: true,
      render: (row) => searchQuery ? highlightText(row.nombre_empresa, searchQuery) : row.nombre_empresa
    },
    { 
      key: 'awb', 
      label: 'AWB', 
      sortable: true,
      render: (row) => searchQuery ? highlightText(row.awb, searchQuery) : row.awb
    },
    { 
      key: 'fecha_ingreso', 
      label: 'Fecha Ingreso', 
      sortable: true,
      render: (row) => row.fecha_ingreso ? formatDate(row.fecha_ingreso) : '-'
    },
    { 
      key: 'estado', 
      label: 'Estado', 
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.estado === 'PAGADO' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
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
              <p className="text-3xl font-bold text-gtl-gray">{estadisticas.total}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-3xl font-bold text-green-600">{estadisticas.pagados}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-red-600">{estadisticas.pendientes}</p>
            </div>
          </Card>
        </div>
      )}

      {/* 🔍 SEARCH BAR */}
      <Card>
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder='Buscar por AWB o Empresa... (presiona "/" para buscar)'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* 🆕 BOTÓN BÚSQUEDA AVANZADA */}
              <button
                onClick={() => setShowAdvancedSearch(true)}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition shadow-lg hover:shadow-xl"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium">Búsqueda Avanzada</span>
              </button>
              
              {/* Quick Filters */}
              <div className="flex gap-2">
                {['Todos', 'No Pagado', 'Pagado'].map(estado => (
                  <button
                    key={estado}
                    onClick={() => setEstadoFilter(estado === 'Todos' ? 'TODOS' : estado.toUpperCase().replace(' ', '_'))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      estadoFilter === (estado === 'Todos' ? 'TODOS' : estado.toUpperCase().replace(' ', '_'))
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {estado}
                  </button>
                ))}
              </div>
            </div>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && !searchQuery && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Búsquedas recientes</span>
                  </div>
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSearchQuery(item)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FilterIcon className="w-4 h-4" />
                <span className="font-medium">Filtros activos:</span>
              </div>
              {activeFilters.map((filter, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {filter.label}
                  <button
                    onClick={() => removeFilter(filter.type)}
                    className="hover:text-red-900"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Results Counter */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span>
                Mostrando <span className="font-semibold text-red-600">{filteredPagos.length}</span> de {pagos.length} pagos
              </span>
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  <Search className="w-3 h-3" />
                  Buscando en todo el año
                </span>
              )}
            </div>
            {activeFilters.length > 0 && (
              <span className="text-xs text-gray-500">
                Presiona <kbd className="px-2 py-1 bg-gray-200 rounded">Esc</kbd> para limpiar filtros
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <h2 className="text-xl font-semibold text-gtl-gray mb-4">
          Cuentas por Cobrar - {mesSeleccionado}
        </h2>
        {filteredPagos.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500 mb-4">
              Intenta ajustar los filtros o la búsqueda
            </p>
            <Button variant="secondary" onClick={clearAllFilters}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <Table data={filteredPagos} columns={columns} />
        )}
      </Card>

      {/* 🆕 MODAL BÚSQUEDA AVANZADA */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Búsqueda Avanzada</h2>
              </div>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="text-white hover:bg-red-800 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="text-center py-12">
                <SlidersHorizontal className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Próximamente: Filtros Avanzados
                </h3>
                <p className="text-gray-600 mb-6">
                  Aquí podrás agregar filtros por rangos de fecha, montos, múltiples AWB y más.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="font-medium text-sm">Rango de fechas</span>
                    </div>
                    <p className="text-xs text-gray-600">Filtrar por periodo específico</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="font-medium text-sm">Rango de montos</span>
                    </div>
                    <p className="text-xs text-gray-600">Filtrar por valor mínimo/máximo</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="font-medium text-sm">Múltiples AWB</span>
                    </div>
                    <p className="text-xs text-gray-600">Buscar varios AWB a la vez</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="font-medium text-sm">Exportar resultados</span>
                    </div>
                    <p className="text-xs text-gray-600">Descargar en Excel/PDF</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <Button
                variant="secondary"
                onClick={() => setShowAdvancedSearch(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosPage;
