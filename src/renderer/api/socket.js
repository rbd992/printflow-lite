import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket = null;
const listeners = new Map();

export function connectSocket(serverUrl, token) {
  if (socket?.connected) socket.disconnect();
  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });
  socket.on('connect_error', err => {
    if (err.message === 'Invalid token' || err.message === 'No token') {
      useAuthStore.getState().logout();
    }
  });
  listeners.forEach((handler, event) => socket.on(event, handler));
  return socket;
}

export function disconnectSocket() { socket?.disconnect(); socket = null; }

export function onSocketEvent(event, handler) {
  listeners.set(event, handler);
  socket?.on(event, handler);
  return () => { listeners.delete(event); socket?.off(event, handler); };
}

export function getSocket() { return socket; }
