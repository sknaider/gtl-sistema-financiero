import axios from 'axios';

const api = axios.create({
  baseURL: '/sistema/api/v1'
});

export default api;
