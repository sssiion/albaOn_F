import api from './index';

export const uploadMedia = (manualId, formData) =>
  api.post(`/api/media/${manualId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteMedia = (mediaId) =>
  api.delete(`/api/media/${mediaId}`);
export const uploadNodeMedia = (manualId, formData) =>
  api.post(`/api/media/node/${manualId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteNodeMedia = (mediaId) =>
  api.delete(`/api/media/node/${mediaId}`);
