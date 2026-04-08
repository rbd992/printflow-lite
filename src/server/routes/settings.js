const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

function ensureTable() {
  getDb().exec(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')), updated_by INTEGER)`);
}

// POST /api/settings/key — upsert a setting by key (used by setup wizard)
router.post('/key', authenticate, (req, res) => {
  try {
    ensureTable();
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    getDb().prepare(`INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES (?, ?, datetime('now'), ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
      .run(key, JSON.stringify(value), req.user.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:key', authenticate, (req, res) => {
  try {
    ensureTable();
    const row = getDb().prepare('SELECT value FROM app_settings WHERE key = ?').get(req.params.key);
    if (!row) return res.json({ value: null });
    try { return res.json({ value: JSON.parse(row.value) }); } catch { return res.json({ value: row.value }); }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:key', authenticate, (req, res) => {
  try {
    ensureTable();
    getDb().prepare(`INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES (?, ?, datetime('now'), ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by`)
      .run(req.params.key, JSON.stringify(req.body.value), req.user.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:key', authenticate, (req, res) => {
  try {
    ensureTable();
    getDb().prepare('DELETE FROM app_settings WHERE key = ?').run(req.params.key);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
