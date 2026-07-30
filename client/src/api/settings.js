import { api } from './client';

export const getSettings  = ()        => api.get('/settings');
export const updateSetting = (payload) => api.put('/settings', payload);
