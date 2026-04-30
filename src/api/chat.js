import api from './index';

export const sendMessage = (storeId, question, workerName) =>
  api.post(`/api/chat/${storeId}`, { question, workerName });

export const getChatLogs = (storeId) =>
  api.get(`/api/chat/${storeId}/logs`);


