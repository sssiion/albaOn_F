import api from './index';

export const sendMessage = (storeId, question) =>
  api.post(`/api/chat/${storeId}`, { question });

export const getChatLogs = (storeId) =>
  api.get(`/api/chat/${storeId}/logs`);


