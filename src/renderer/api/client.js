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

export default api;
