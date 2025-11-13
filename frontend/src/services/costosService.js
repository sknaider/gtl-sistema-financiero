import api from './api';

export const costosService = {
  getAll: async (mes, año = null) => {
    let url = `/costos/?mes=${mes}`;
    if (año) {
      url += `&anio=${año}`;
    }
    const response = await api.get(url);
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
  
  getKpis: async (mes, año = null) => {
    let url = `/costos/mes/${mes}/kpis`;
    if (año) {
      url += `?anio=${año}`;
    }
    const response = await api.get(url);
    return response.data;
  }
};
