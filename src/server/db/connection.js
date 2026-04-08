const Database = require('better-sqlite3');
const path = require('path');
const fs   = require('fs');
const logger = require('../services/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/printflow.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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
