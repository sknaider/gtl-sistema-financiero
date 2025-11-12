import api from './api';

export const empresasService = {
  getAll: async (limit = 200) => {
    const response = await api.get(`/empresas/?limit=${limit}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/empresas/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/empresas/', data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/empresas/${id}`);
    return response.data;
  },
};
