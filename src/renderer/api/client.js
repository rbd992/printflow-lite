import axios from 'axios';

let serverUrl = 'http://127.0.0.1:3001';

export function setServerUrlCache(url) { serverUrl = url || 'http://127.0.0.1:3001'; }
export function getServerUrl() { return serverUrl; }

export const api = axios.create({ baseURL: serverUrl, timeout: 15000 });

api.interceptors.request.use(async config => {
  config.baseURL = serverUrl;
  try {
          const token = await window.printflow?.getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

export const dashboardApi    = { get: ()         => api.get('/api/dashboard') };
export const ordersApi       = {
  list:   (p) => api.get('/api/orders', { params: p }),
  get:    (id) => api.get(`/api/orders/${id}`),
  create: (d)  => api.post('/api/orders', d),
  update: (id,d) => api.patch(`/api/orders/${id}`, d),
  remove: (id) => api.delete(`/api/orders/${id}`),
};
export const filamentApi     = {
  list:   ()      => api.get('/api/filament'),
  create: (d)     => api.post('/api/filament', d),
  update: (id,d)  => api.patch(`/api/filament/${id}`, d),
  remove: (id)    => api.delete(`/api/filament/${id}`),
};
export const settingsApi     = {
  get: (key)    => api.get(`/api/settings/${key}`),
  set: (key, v) => api.post('/api/settings/key', { key, value: v }),
};
export const customersApi    = {
  list:   ()     => api.get('/api/customers'),
  create: (d)    => api.post('/api/customers', d),
  update: (id,d) => api.put(`/api/customers/${id}`, d),
  remove: (id)   => api.delete(`/api/customers/${id}`),
};
export const transactionsApi = {
  list:   (p)  => api.get('/api/transactions', { params: p }),
  create: (d)  => api.post('/api/transactions', d),
  remove: (id) => api.delete(`/api/transactions/${id}`),
};
export const usersApi        = {
  list:   ()     => api.get('/api/users'),
  create: (d)    => api.post('/api/users', d),
  update: (id,d) => api.patch(`/api/users/${id}`, d),
  remove: (id)   => api.delete(`/api/users/${id}`),
};
export const printersApi     = {
  list:   ()     => api.get('/api/printers'),
  create: (d)    => api.post('/api/printers', d),
  update: (id,d) => api.patch(`/api/printers/${id}`, d),
  remove: (id)   => api.delete(`/api/printers/${id}`),
};
export const partsApi        = {
  list:   ()     => api.get('/api/parts'),
  create: (d)    => api.post('/api/parts', d),
  update: (id,d) => api.patch(`/api/parts/${id}`, d),
  remove: (id)   => api.delete(`/api/parts/${id}`),
};
export const maintenanceApi  = {
  list:   (p)  => api.get('/api/maintenance', { params: p }),
  create: (d)  => api.post('/api/maintenance', d),
  done:   (id) => api.patch(`/api/maintenance/${id}/done`),
  remove: (id) => api.delete(`/api/maintenance/${id}`),
};
export const shippingApi     = { getRates: (d) => api.post('/api/shipping/rates', d) };
export const auditApi        = { list: (p) => api.get('/api/audit', { params: p }) };

export default api;
