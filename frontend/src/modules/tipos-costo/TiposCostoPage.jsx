import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loading from '../../components/common/Loading';
import { tiposCostoService } from '../../services/tiposCostoService';

const TiposCostoPage = () => {
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    loadTipos();
  }, []);

  const loadTipos = async () => {
    setLoading(true);
    try {
      const data = await tiposCostoService.getAll(true);
      // Ordenar: activos primero, luego inactivos, ambos alfabéticamente
      const sorted = data.sort((a, b) => {
        if (a.activo === b.activo) {
          return a.nombre.localeCompare(b.nombre);
        }
        return b.activo - a.activo; // true (1) antes que false (0)
      });
      setTipos(sorted);
    } catch (error) {
      console.error('Error cargando tipos:', error);
      alert('Error al cargar los tipos de costo');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tiposCostoService.create(formData);
      setFormData({ nombre: '', descripcion: '' });
      await loadTipos();
      alert('Tipo creado exitosamente');
    } catch (error) {
      console.error('Error creando tipo:', error);
      alert('Error al crear el tipo');
    }
  };

  const handleUpdate = async (id) => {
    try {
      await tiposCostoService.update(id, editing);
      setEditing(null);
      await loadTipos();
      alert('Tipo actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando tipo:', error);
      alert('Error al actualizar el tipo');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este tipo?')) return;
    try {
      await tiposCostoService.delete(id);
      await loadTipos();
      alert('Tipo eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando tipo:', error);
      alert('Error al eliminar el tipo');
    }
  };

  const handleActivate = async (id) => {
    if (!confirm('¿Está seguro de reactivar este tipo?')) return;
    try {
      await tiposCostoService.update(id, { activo: true });
      await loadTipos();
      alert('Tipo reactivado exitosamente');
    } catch (error) {
      console.error('Error reactivando tipo:', error);
      alert('Error al reactivar el tipo');
    }
  };

  if (loading) return <Loading fullScreen text="Cargando tipos..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gtl-gray">Gestión de Tipos de Costo</h1>

      {/* Formulario crear nuevo */}
      <Card title="Agregar Nuevo Tipo">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="MARKETING"
            />
            <Input
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              placeholder="Gastos de marketing y publicidad"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={Plus}>
              Agregar Tipo
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista de tipos */}
      <Card title={`Tipos de Costo (${tipos.length})`}>
        <div className="space-y-2">
          {tipos.map((tipo) => (
            <div
              key={tipo.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                tipo.activo ? 'bg-white' : 'bg-gray-100'
              }`}
            >
              {editing?.id === tipo.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-4 mr-4">
                    <Input
                      value={editing.nombre}
                      onChange={(e) => setEditing({...editing, nombre: e.target.value})}
                    />
                    <Input
                      value={editing.descripcion || ''}
                      onChange={(e) => setEditing({...editing, descripcion: e.target.value})}
                      placeholder="Descripción"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Save}
                      onClick={() => handleUpdate(tipo.id)}
                    >
                      Guardar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={X}
                      onClick={() => setEditing(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{tipo.nombre}</h3>
                    {tipo.descripcion && (
                      <p className="text-sm text-gray-600">{tipo.descripcion}</p>
                    )}
                    {!tipo.activo && (
                      <span className="text-xs text-red-600">(Inactivo)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => setEditing(tipo)}
                    >
                      Editar
                    </Button>
                    {tipo.activo ? (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(tipo.id)}
                      >
                        Eliminar
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleActivate(tipo.id)}
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TiposCostoPage;
