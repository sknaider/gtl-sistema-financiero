import api from './api';

export const costosService = {
  getAll: async (mes) => {
    const response = await api.get(`/costos/?mes=${mes}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/costos/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/costos/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/costos/${id}`);
    return response.data;
  },

  getKPIs: async (mes) => {
    const response = await api.get(`/costos/mes/${mes}/kpis`);
    return response.data;
  },
};
