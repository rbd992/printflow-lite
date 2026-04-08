const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const logger = require('../services/logger');

// Use DB_PATH env var, fall back to a safe writable location
const DB_PATH = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(os.homedir(), 'PrintFlowLite', 'data', 'printflow.db');

const dir = path.dirname(DB_PATH);
try {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} catch (e) {
  console.error('[db] Could not create data dir:', e.message);
}

let _db;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.pragma('synchronous = NORMAL');
    _db.pragma('cache_size = -32000');
    logger.info(`SQLite connected: ${DB_PATH}`);
  }
  return _db;
}

module.exports = { getDb };
