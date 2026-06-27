import api from './axios';
export const getBundles = (params) => api.get('/bundles', { params });
export const getBundle = (bundleId) => api.get(`/bundles/${bundleId}`);
export const createBundle = (data) => api.post('/bundles', data);
export const getBundleHistory = (bundleId) => api.get(`/transitions/${bundleId}/history`);
export const getBundleQRCode = async (bundleId) => {
  const res = await api.get(`/bundles/${bundleId}/qrcode`, { responseType: 'blob' });
  return URL.createObjectURL(res.data);
};
