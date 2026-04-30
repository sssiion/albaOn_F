import api from './index';

export const uploadMedia = (manualId, formData) =>
  api.post(`/api/media/${manualId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteMedia = (mediaId) =>
  api.delete(`/api/media/${mediaId}`);
