import api from './index';

export const sendMessage = (storeId, question, workerName) =>
  api.post(`/api/chat/${storeId}`, { question, workerName });

export const getChatLogs = (storeId) =>
  api.get(`/api/chat/${storeId}/logs`);

export const reanswer = (storeId, logId) =>   // ← 추가
  api.post(`/api/chat/${storeId}/reanswer/${logId}`);


