import api from './axiosInstance';
export const logTransition = (data) => api.post('/transitions', data);
