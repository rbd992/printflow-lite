import axios from 'axios';

let serverUrl = 'http://127.0.0.1:3001';

export function setServerUrlCache(url) {
  serverUrl = url || 'http://127.0.0.1:3001';
}

export function getServerUrl() {
  return serverUrl;
}

export const api = axios.create({ baseURL: serverUrl, timeout: 15000 });

// Intercept to always use current serverUrl and inject token
api.interceptors.request.use(async config => {
  config.baseURL = serverUrl;
  try {
    const token = await window.printflow.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Named convenience APIs (same pattern as enterprise)
export const ordersApi = {
  list:   (params) => api.get('/api/orders', { params }),
  get:    (id)     => api.get(`/api/orders/${id}`),
  create: (data)   => api.post('/api/orders', data),
  update: (id, d)  => api.patch(`/api/orders/${id}`, d),
  delete: (id)     => api.delete(`/api/orders/${id}`),
};

export const filamentApi = {
  list:   ()       => api.get('/api/filament'),
  create: (data)   => api.post('/api/filament', data),
  update: (id, d)  => api.patch(`/api/filament/${id}`, d),
  delete: (id)     => api.delete(`/api/filament/${id}`),
};

export const settingsApi = {
  get:    (key)     => api.get(`/api/settings/${key}`),
  set:    (key, v)  => api.post('/api/settings/key', { key, value: v }),
};

export const dashboardApi = { get: () => api.get('/api/dashboard') };
export const ordersApi = {
  list:   (params) => api.get('/api/orders', { params }),
  get:    (id)     => api.get(`/api/orders/${id}`),
  create: (data)   => api.post('/api/orders', data),
  update: (id, d)  => api.patch(`/api/orders/${id}`, d),
  remove: (id)     => api.delete(`/api/orders/${id}`),
};
export const filamentApi = {
  list:   ()       => api.get('/api/filament'),
  create: (data)   => api.post('/api/filament', data),
  update: (id, d)  => api.patch(`/api/filament/${id}`, d),
  remove: (id)     => api.delete(`/api/filament/${id}`),
};
export const settingsApi = {
  get:    (key)     => api.get(`/api/settings/${key}`),
  set:    (key, v)  => api.post('/api/settings/key', { key, value: v }),
};
export const customersApi = {
  list:   ()       => api.get('/api/customers'),
  create: (data)   => api.post('/api/customers', data),
  update: (id, d)  => api.put(`/api/customers/${id}`, d),
  remove: (id)     => api.delete(`/api/customers/${id}`),
};
export const transactionsApi = {
  list:   (params) => api.get('/api/transactions', { params }),
  create: (data)   => api.post('/api/transactions', data),
  remove: (id)     => api.delete(`/api/transactions/${id}`),
};
export const usersApi = {
  list:   ()       => api.get('/api/users'),
  create: (data)   => api.post('/api/users', data),
  update: (id, d)  => api.patch(`/api/users/${id}`, d),
  remove: (id)     => api.delete(`/api/users/${id}`),
};
export const printersApi = {
  list:   ()       => api.get('/api/printers'),
  create: (data)   => api.post('/api/printers', data),
  update: (id, d)  => api.patch(`/api/printers/${id}`, d),
  remove: (id)     => api.delete(`/api/printers/${id}`),
};
export const partsApi = {
  list:   ()       => api.get('/api/parts'),
  create: (data)   => api.post('/api/parts', data),
  update: (id, d)  => api.patch(`/api/parts/${id}`, d),
  remove: (id)     => api.delete(`/api/parts/${id}`),
};
export const maintenanceApi = {
  list:   (params) => api.get('/api/maintenance', { params }),
  create: (data)   => api.post('/api/maintenance', data),
  done:   (id)     => api.patch(`/api/maintenance/${id}/done`),
  remove: (id)     => api.delete(`/api/maintenance/${id}`),
};
export const shippingApi = {
  getRates: (data) => api.post('/api/shipping/rates', data),
};
export const auditApi = {
  list: (params) => api.get('/api/audit', { params }),
};
export default api;
