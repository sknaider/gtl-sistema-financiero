import api from './api';

export const tiposCostoService = {
  getAll: async (incluirInactivos = false) => {
    const response = await api.get(`/tipos-costo/?incluir_inactivos=${incluirInactivos}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/tipos-costo/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tipos-costo/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/tipos-costo/${id}`);
    return response.data;
  },
};
