import api from './index';

export const register = (name, pin) =>
  api.post('/api/auth/register', { name, pin });

export const login = (name, pin) =>
  api.post('/api/auth/login', { name, pin });
