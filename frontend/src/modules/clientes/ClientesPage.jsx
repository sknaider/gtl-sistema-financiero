import { useState, useEffect } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [editando, setEditando] = useState(null);

  const agregarCliente = async () => {
    const response = await fetch('/sistema/api/clientes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, dni, telefono, email, color })
    });
    if (response.ok) {
      cargarClientes();
      limpiarFormulario();
    }
  };

  const actualizarCliente = async () => {
    const response = await fetch(`/sistema/api/clientes/${editando.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, dni, telefono, email, color })
    });
    if (response.ok) {
      cargarClientes();
      limpiarFormulario();
      setEditando(null);
    }
  };

  const eliminarCliente = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    const response = await fetch(`/sistema/api/clientes/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      cargarClientes();
    }
  };

  const iniciarEdicion = (cliente) => {
    setEditando(cliente);
    setNombre(cliente.nombre);
    setDni(cliente.dni || '');
    setTelefono(cliente.telefono || '');
    setEmail(cliente.email || '');
    setColor(cliente.color || '#3B82F6');
  };

  const limpiarFormulario = () => {
    setNombre('');
    setDni('');
    setTelefono('');
    setEmail('');
    setColor('#3B82F6');
  };

  const cancelarEdicion = () => {
    setEditando(null);
    limpiarFormulario();
  };

  const cargarClientes = async () => {
    const response = await fetch('/sistema/api/clientes/');
    const data = await response.json();
    setClientes(data);
  };

  useEffect(() => { cargarClientes(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Clientes</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">
            {editando ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </h2>
          {editando && (
            <button
              onClick={cancelarEdicion}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input 
            className="border p-2 rounded" 
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input 
            className="border p-2 rounded" 
            placeholder="DNI"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
          />
          <input 
            className="border p-2 rounded" 
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <input 
            className="border p-2 rounded" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label>Color:</label>
            <input 
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-20 h-10"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button 
            onClick={editando ? actualizarCliente : agregarCliente}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            {editando ? '✓ Actualizar Cliente' : '+ Agregar Cliente'}
          </button>
          {editando && (
            <button
              onClick={cancelarEdicion}
              className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl mb-4">Listado de Clientes ({clientes.length})</h2>
        {clientes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay clientes registrados</p>
        ) : (
          <div className="space-y-2">
            {clientes.map(c => (
              <div 
                key={c.id} 
                className="border-l-4 p-3 hover:bg-gray-50 flex items-center justify-between"
                style={{ borderColor: c.color }}
              >
                <div>
                  <div className="font-bold">{c.nombre}</div>
                  <div className="text-sm text-gray-600">
                    DNI: {c.dni || 'N/A'} | Tel: {c.telefono || 'N/A'} | Email: {c.email || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => iniciarEdicion(c)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => eliminarCliente(c.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
