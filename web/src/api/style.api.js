import api from './axios';
export const getStyles = () => api.get('/styles');
export const createStyle = (data) => api.post('/styles', data);
