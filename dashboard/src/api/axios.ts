import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cubiko_api-staging.diegoivan-mae.workers.dev/api', // Adjust according to backend config
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
