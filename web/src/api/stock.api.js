import api from './axios';
export const getStock = () => api.get('/stock');
export const transferStock = (data) => api.post('/stock/transfer', data);
export const getMovements = () => api.get('/stock/movements');
