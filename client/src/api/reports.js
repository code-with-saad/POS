import { api } from './client.js';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to)   q.set('to', params.to);
  if (params.limit) q.set('limit', params.limit);
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export const reportsApi = {
  summary: (params) => api.get(`/reports/summary${buildQuery(params)}`),
  daily:   (params) => api.get(`/reports/daily${buildQuery(params)}`),
  items:   (params) => api.get(`/reports/items${buildQuery(params)}`),
  payment: (params) => api.get(`/reports/payment${buildQuery(params)}`),
  cashier: (params) => api.get(`/reports/cashier${buildQuery(params)}`),
};
