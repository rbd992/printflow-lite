const { Server } = require('socket.io');
const jwt    = require('jsonwebtoken');
const logger = require('./logger');

let _io;

function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: { origin: '*', credentials: true },
    transports: ['websocket', 'polling'],
  });

  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.data.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch { next(new Error('Invalid token')); }
  });

  _io.on('connection', (socket) => {
    const { id: userId, role, name } = socket.data.user;
    socket.join(`role:${role}`);
    socket.join(`user:${userId}`);
    socket.on('disconnect', () => logger.debug(`Socket disconnected: ${name}`));
  });

  logger.info('Socket.io initialized');
  return _io;
}

function broadcast(event, data) { if (_io) _io.emit(event, data); }
function getIo() { return _io; }

module.exports = { initSocket, broadcast, getIo };
