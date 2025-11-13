import api from './api';

export const ingresosService = {
  getAll: async (mes, año = null) => {
    let url = `/ingresos/?mes=${mes}`;
    if (año) {
      url += `&anio=${año}`;
    }
    const response = await api.get(url);
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
  
  getKpis: async (mes, año = null) => {
    let url = `/ingresos/mes/${mes}/kpis`;
    if (año) {
      url += `?anio=${año}`;
    }
    const response = await api.get(url);
    return response.data;
  }
};
