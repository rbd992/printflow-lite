const winston = require('winston');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// Use LOG_DIR env var, fall back to a safe writable temp directory
const LOG_DIR = process.env.LOG_DIR
  ? process.env.LOG_DIR
  : path.join(os.tmpdir(), 'printflow-lite-logs');

try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {
  // If we can't create logs dir, continue without file logging
  console.error('[logger] Could not create log dir:', e.message);
}

const fmt = winston.format;
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fmt.combine(fmt.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), fmt.errors({ stack: true }), fmt.json()),
  transports: [
    new winston.transports.Console({
      format: fmt.combine(fmt.colorize(), fmt.printf(({ level, message, timestamp, stack }) =>
        `${timestamp} [${level}] ${stack || message}`)),
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'), level: 'error',
      maxsize: 5 * 1024 * 1024, maxFiles: 3, tailable: true,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      maxsize: 10 * 1024 * 1024, maxFiles: 5, tailable: true,
    }),
  ],
});

module.exports = logger;
