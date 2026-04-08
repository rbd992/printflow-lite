'use strict';
// PrintFlow Lite — Bundled local server
// Runs as a child process spawned by Electron main.js
// Binds to 127.0.0.1 only — not exposed on network

const http = require('http');
const app  = require('./app');
const { initSocket }    = require('./services/socket');
const { runMigrations } = require('./db/migrate');
const logger = require('./services/logger');

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';

async function start() {
  try {
    logger.info('PrintFlow Lite server starting...');
    logger.info(`DB: ${process.env.DB_PATH}`);

    runMigrations();
    logger.info('Migrations complete.');

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, HOST, () => {
      logger.info(`PrintFlow Lite server ready on ${HOST}:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (sig) => {
      logger.info(`${sig} — shutting down`);
      server.close(() => { logger.info('Server closed'); process.exit(0); });
      setTimeout(() => process.exit(1), 8000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
