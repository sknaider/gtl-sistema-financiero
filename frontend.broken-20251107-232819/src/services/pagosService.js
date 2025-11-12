import api from './api';

export const pagosService = {
  getAll: async (mes, estado = null) => {
    let url = `/pagos/?mes=${mes}`;
    if (estado) url += `&estado=${estado}`;
    const response = await api.get(url);
    return response.data;
  },

  updateEstado: async (id, estado) => {
    const response = await api.put(`/pagos/${id}/estado`, { estado });
    return response.data;
  },

  getEstadisticas: async (mes) => {
    const response = await api.get(`/pagos/mes/${mes}/estadisticas`);
    return response.data;
  },
};
