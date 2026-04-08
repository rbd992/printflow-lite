// [BOTH] printers route — brand-agnostic, no Bambu-specific required fields
const router = require('express').Router();
const { getDb } = require('../db/connection');
const { audit } = require('../db/audit');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM printers ORDER BY name').all());
});

router.post('/', authenticate, authorize('owner', 'manager'), (req, res) => {
  const db = getDb();
  const { name, brand = 'generic', model, serial, ip_address, access_code, connection_type = 'network', has_ams = 0, ams_count = 0, notes } = req.body;
  if (!name || !model || !serial) return res.status(400).json({ error: 'name, model, serial required' });
  try {
    const result = db.prepare(`INSERT INTO printers (name, brand, model, serial, ip_address, access_code, connection_type, has_ams, ams_count, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(name, brand, model, serial, ip_address || null, access_code || null, connection_type, has_ams ? 1 : 0, ams_count, notes || null);
    const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(result.lastInsertRowid);
    audit({ userId: req.user.id, userName: req.user.name, action: 'create', tableName: 'printers', recordId: printer.id, newValue: printer });
    res.status(201).json(printer);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'A printer with this serial number already exists' });
    throw e;
  }
});

router.patch('/:id', authenticate, authorize('owner', 'manager'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Printer not found' });
  const allowed = ['name','brand','model','serial','ip_address','access_code','connection_type','has_ams','ams_count','is_active','notes'];
  const updates = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields' });
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE printers SET ${sets} WHERE id = ?`).run(...Object.values(updates), existing.id);
  res.json(db.prepare('SELECT * FROM printers WHERE id = ?').get(existing.id));
});

router.delete('/:id', authenticate, authorize('owner'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Printer not found' });
  db.prepare('DELETE FROM printers WHERE id = ?').run(existing.id);
  audit({ userId: req.user.id, userName: req.user.name, action: 'delete', tableName: 'printers', recordId: existing.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;
