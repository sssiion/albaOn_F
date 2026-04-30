import api from './index';

export const getManuals   = (storeId)             => api.get(`/api/manuals/${storeId}`);
export const createManual = (storeId, data)        => api.post(`/api/manuals/${storeId}`, data);
export const updateManual = (storeId, manualId, data)      => api.put(`/api/manuals/${storeId}/${manualId}`, data);
export const deleteManual = (storeId, manualId)    => api.delete(`/api/manuals/${storeId}/${manualId}`);

export const uploadAudio = (storeId, formData) =>
  api.post(`/api/manuals/${storeId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
