import api from './axiosInstance';
export const getBundle = (bundleId) => api.get(`/bundles/${bundleId}`);
export const getBundleHistory = (bundleId) => api.get(`/transitions/${bundleId}/history`);
