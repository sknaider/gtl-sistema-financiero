import api from './api';

export const utilidadesService = {
  getByMes: async (mes) => {
    const response = await api.get(`/utilidades/${mes}`);
    return response.data;
  },

  getKPIs: async (mes) => {
    const response = await api.get(`/utilidades/${mes}/kpis`);
    return response.data;
  },

  recalcular: async (mes) => {
    const response = await api.post(`/utilidades/${mes}/recalcular`);
    return response.data;
  },
};
