import api from './api';

export const clientesService = {
  getAll: async (limit = 200) => {
    const response = await api.get(`/clientes/?limit=${limit}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/clientes/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/clientes/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },
};
