import api from './index';

export const getCategories    = (storeId)              => api.get(`/api/categories/${storeId}`);
export const addCategory      = (storeId, name)        => api.post(`/api/categories/${storeId}`, { name });
export const deleteCategory   = (storeId, categoryId)  => api.delete(`/api/categories/${storeId}/${categoryId}`);
