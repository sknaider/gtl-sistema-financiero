import { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, Search, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Loading from '../../components/common/Loading';
import { empresasService } from '../../services/empresasService';

const EmpresasPage = () => {
  const [empresas, setEmpresas] = useState([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: ''
  });
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Filtrar empresas cuando cambia el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredEmpresas(empresas);
    } else {
      const filtered = empresas.filter(empresa =>
        empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmpresas(filtered);
    }
  }, [searchTerm, empresas]);
  
  useEffect(() => {
    // Verificar duplicados en tiempo real mientras escribe
    if (formData.nombre.trim().length > 3) {
      const exists = empresas.some(
        empresa => empresa.nombre.toLowerCase() === formData.nombre.toLowerCase()
      );
      setIsDuplicate(exists);
    } else {
      setIsDuplicate(false);
    }
  }, [formData.nombre, empresas]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await empresasService.getAll(500);
      setEmpresas(data);
      setFilteredEmpresas(data);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      alert('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      alert('El nombre de la empresa es requerido');
      return;
    }
    
    if (isDuplicate) {
      alert('Esta empresa ya existe en el sistema. Use la búsqueda para encontrarla.');
      return;
    }
    
    setSubmitting(true);
    try {
      await empresasService.create(formData);
      setFormData({ nombre: '' });
      setIsDuplicate(false);
      await loadData();
      alert('Empresa creada exitosamente');
    } catch (error) {
      console.error('Error creando empresa:', error);
      alert('Error al crear la empresa. Verifique que no exista duplicada.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id, nombre) => {
    if (!confirm(`¿Está seguro de eliminar la empresa "${nombre}"?\n\nEsto puede afectar registros existentes.`)) {
      return;
    }
    
    try {
      await empresasService.delete(id);
      await loadData();
      alert('Empresa eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando empresa:', error);
      alert('Error al eliminar la empresa. Puede tener registros asociados.');
    }
  };
  
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre de la Empresa', sortable: true },
    { 
      key: 'created_at', 
      label: 'Fecha de Registro', 
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString('es-PE')
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (row) => (
        <Button
          variant="danger"
          size="sm"
          icon={Trash2}
          onClick={() => handleDelete(row.id, row.nombre)}
        >
          Eliminar
        </Button>
      )
    }
  ];
  
  if (loading) return <Loading fullScreen text="Cargando empresas..." />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gtl-gray">Gestión de Empresas</h1>
          <p className="text-gray-600 mt-1">Catálogo de clientes del sistema</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gtl-red">{empresas.length}</span> empresas
        </div>
      </div>
      
      {/* Formulario */}
      <Card 
        title="Agregar Nueva Empresa" 
        subtitle="Complete el nombre de la empresa cliente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Nombre de la Empresa"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({nombre: e.target.value.toUpperCase()})}
                placeholder="CORPORACIÓN EJEMPLO S.A.C."
                icon={Building2}
              />
              {isDuplicate && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>⚠️ Esta empresa ya existe en el sistema</span>
                </div>
              )}
              {!isDuplicate && formData.nombre.trim().length > 3 && (
                <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                  ✓ Nombre disponible
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                El nombre se convertirá automáticamente a mayúsculas
              </p>
            </div>
            
            <Button
              type="submit"
              variant="primary"
              icon={Plus}
              loading={submitting}
              disabled={isDuplicate}
            >
              Agregar Empresa
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Búsqueda */}
      <Card title="Buscar Empresas">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nombre de empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          {searchTerm && (
            <Button
              variant="secondary"
              onClick={() => setSearchTerm('')}
            >
              Limpiar
            </Button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Mostrando {filteredEmpresas.length} de {empresas.length} empresas
          </p>
        )}
      </Card>
      
      {/* Tabla */}
      <Card 
        title="Listado de Empresas" 
        subtitle={`${filteredEmpresas.length} empresas ${searchTerm ? 'encontradas' : 'registradas'}`}
      >
        {filteredEmpresas.length === 0 && searchTerm ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron empresas con el término "{searchTerm}"
          </div>
        ) : (
          <Table columns={columns} data={filteredEmpresas} />
        )}
      </Card>
    </div>
  );
};

export default EmpresasPage;
