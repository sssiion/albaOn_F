import api from './index';

export const getStores    = ()             => api.get('/api/stores');
export const createStore  = (data)         => api.post('/api/stores', data);
export const getStore     = (storeId)      => api.get(`/api/stores/${storeId}`);
export const deleteStore  = (storeId)      => api.delete(`/api/stores/${storeId}`);

export const getStoreStats = (storeId) =>
  api.get(`/api/stores/${storeId}/stats`);