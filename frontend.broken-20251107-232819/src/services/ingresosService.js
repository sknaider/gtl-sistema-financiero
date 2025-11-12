import api from './api';

export const ingresosService = {
  getAll: async (mes) => {
    const response = await api.get(`/ingresos/?mes=${mes}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/ingresos/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/ingresos/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/ingresos/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/ingresos/${id}`);
    return response.data;
  },

  getKPIs: async (mes) => {
    const response = await api.get(`/ingresos/mes/${mes}/kpis`);
    return response.data;
  },
};
