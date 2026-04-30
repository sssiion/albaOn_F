import api from './index';

export const getStoreByInvite = (inviteCode) =>
  api.get(`/api/invite/${inviteCode}`);

export const joinStore = (inviteCode) =>
  api.post(`/api/invite/${inviteCode}/join`);