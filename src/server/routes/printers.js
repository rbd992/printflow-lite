const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const { broadcast } = require('../services/socket');

// ── Ensure tables exist on first load ───────────────────────────────────────
(function migrate() {
  try {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS printer_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT 'generic', model TEXT DEFAULT '',
        host TEXT DEFAULT '', port INTEGER DEFAULT 80, api_key TEXT DEFAULT '',
        access_code TEXT DEFAULT '', serial_number TEXT DEFAULT '', password TEXT DEFAULT '',
        status TEXT DEFAULT 'offline',
        camera_enabled INTEGER DEFAULT 0, camera_protocol TEXT DEFAULT 'mjpeg',
        camera_url TEXT DEFAULT '', camera_snapshot TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS printer_status_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT, printer_id INTEGER NOT NULL,
        state TEXT DEFAULT 'unknown', progress REAL DEFAULT 0,
        nozzle_temp REAL DEFAULT 0, nozzle_target REAL DEFAULT 0,
        bed_temp REAL DEFAULT 0, bed_target REAL DEFAULT 0, filename TEXT DEFAULT '',
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS cloud_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, name TEXT DEFAULT '',
        token TEXT DEFAULT '', config TEXT DEFAULT '{}', enabled INTEGER DEFAULT 1,
        last_sync DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) { logger.warn('Printer tables migration:', e.message); }
})();

// ── Printer CRUD ────────────────────────────────────────────────────────────
router.get('/', authenticate, (req, res) => {
  try { res.json(getDb().prepare('SELECT * FROM printers ORDER BY name ASC').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', authenticate, (req, res) => {
  try {
    const row = getDb().prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Printer not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { name, brand, model, host, port, api_key, access_code, serial_number, password, camera_enabled, camera_protocol, camera_url, camera_snapshot, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const r = db.prepare(`INSERT INTO printers (name, brand, model, host, port, api_key, access_code, serial_number, password, camera_enabled, camera_protocol, camera_url, camera_snapshot, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(name, brand||'generic', model||'', host||'', port||80, api_key||'', access_code||'', serial_number||'', password||'', camera_enabled?1:0, camera_protocol||'mjpeg', camera_url||'', camera_snapshot||'', notes||'');
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(r.lastInsertRowid);
    broadcast('printer:created', printer);
    res.status(201).json(printer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Printer not found' });
    const fields = ['name','brand','model','host','port','api_key','access_code','serial_number','password','status','camera_enabled','camera_protocol','camera_url','camera_snapshot','notes'];
    const updates = [], values = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(f === 'camera_enabled' ? (req.body[f] ? 1 : 0) : req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);
    db.prepare(`UPDATE printers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    broadcast('printer:updated', printer);
    res.json(printer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Printer not found' });
    db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
    broadcast('printer:deleted', { id: Number(req.params.id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Connection test ─────────────────────────────────────────────────────────
router.post('/:id/test', authenticate, async (req, res) => {
  try {
    const printer = getDb().prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
    if (!printer) return res.status(404).json({ error: 'Printer not found' });
    const http = require('http');
    const result = await new Promise((resolve, reject) => {
      const r = http.get(`http://${printer.host}:${printer.port}`, { timeout: 5000 }, (resp) => resolve({ reachable: true, statusCode: resp.statusCode }));
      r.on('error', () => reject(new Error('unreachable')));
      r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    });
    res.json({ success: true, ...result });
  } catch (e) { res.json({ success: false, reachable: false, error: e.message }); }
});

// ── Status logging ──────────────────────────────────────────────────────────
router.post('/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename } = req.body;
    db.prepare('INSERT INTO printer_status_log (printer_id, state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename) VALUES (?,?,?,?,?,?,?,?)')
      .run(req.params.id, state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename);
    db.prepare('UPDATE printers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(state, req.params.id);
    broadcast('printer:status', { printerId: Number(req.params.id), state, progress });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/status/history', authenticate, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    res.json(getDb().prepare('SELECT * FROM printer_status_log WHERE printer_id = ? ORDER BY recorded_at DESC LIMIT ?').all(req.params.id, limit));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Cloud connections ───────────────────────────────────────────────────────
router.get('/cloud/connections', authenticate, (req, res) => {
  try { res.json(getDb().prepare('SELECT id, provider, name, enabled, last_sync, created_at FROM cloud_connections ORDER BY provider').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/cloud/connections', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { provider, name, token, config } = req.body;
    const r = db.prepare('INSERT INTO cloud_connections (provider, name, token, config) VALUES (?,?,?,?)').run(provider, name||provider, token||'', JSON.stringify(config||{}));
    res.status(201).json(db.prepare('SELECT id, provider, name, enabled, created_at FROM cloud_connections WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/cloud/connections/:id', authenticate, (req, res) => {
  try { getDb().prepare('DELETE FROM cloud_connections WHERE id = ?').run(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Supported brands reference ──────────────────────────────────────────────
router.get('/meta/brands', (req, res) => {
  res.json({ brands: [
    { id: 'octoprint', name: 'OctoPrint', defaultPort: 80 },
    { id: 'klipper', name: 'Klipper / Moonraker', defaultPort: 7125 },
    { id: 'bambulab', name: 'Bambu Lab', defaultPort: 8883 },
    { id: 'prusa', name: 'Prusa Connect / Link', defaultPort: 80 },
    { id: 'creality', name: 'Creality', defaultPort: 9999 },
    { id: 'duet', name: 'Duet3D / RRF', defaultPort: 80 },
    { id: 'repetier', name: 'Repetier Server', defaultPort: 3344 },
  ]});
});

module.exports = router;
