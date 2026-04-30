const TOKEN_KEY = 'albaon_token';

export const saveToken  = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const removeToken = ()     => localStorage.removeItem(TOKEN_KEY);

export const getAuthHeader = () => ({
  Authorization: `Bearer ${getToken()}`
});