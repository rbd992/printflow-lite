import { create } from 'zustand';
import { api, setServerUrlCache } from '../api/client';

export const useAuthStore = create((set, get) => ({
  token:     null,
  user:      null,
  serverUrl: 'http://127.0.0.1:3001', // Always local in Lite
  isLoading: true,
  error:     null,

  init: async () => {
    // Always use local server in Lite
    setServerUrlCache('http://127.0.0.1:3001');

    try {
      const token = await window.printflow.getToken();
      if (!token) { set({ isLoading: false }); return; }

      // Verify token still valid
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ token, user: res.data, isLoading: false });
    } catch {
      await window.printflow.clearToken();
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      await window.printflow.setToken(token);
      set({ token, user, error: null });
    } catch (e) {
      const msg = e.response?.data?.error || 'Invalid email or password';
      set({ error: msg });
    }
  },

  logout: async () => {
    await window.printflow.clearToken();
    set({ token: null, user: null, error: null });
  },

  clearError: () => set({ error: null }),

  setServerUrl: (url) => {
    // No-op in Lite — always local
    setServerUrlCache('http://127.0.0.1:3001');
  },
}));
