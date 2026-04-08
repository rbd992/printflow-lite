const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');
const { audit } = require('../db/audit');
const { authenticate, authorize } = require('../middleware/auth');
const { broadcast } = require('../services/socket');

router.get('/', authenticate, (req, res) => {
  const spools = getDb().prepare(`SELECT f.*, v.name as vendor_name FROM filament_spools f LEFT JOIN vendors v ON f.vendor_id = v.id ORDER BY f.material, f.brand, f.color_name`).all();
  res.json(spools.map(s => ({ ...s, is_low: s.remaining_g <= s.reorder_at_g, pct_remaining: Math.round((s.remaining_g / s.full_weight_g) * 100) })));
});

router.get('/low-stock', authenticate, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM filament_spools WHERE remaining_g <= reorder_at_g ORDER BY remaining_g ASC').all());
});

router.get('/:id', authenticate, (req, res) => {
  const s = getDb().prepare('SELECT * FROM filament_spools WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Spool not found' });
  res.json(s);
});

router.post('/', authenticate, authorize('owner', 'manager'),
  body('brand').notEmpty().trim(),
  body('material').notEmpty().trim(),
  body('color_name').notEmpty().trim(),
  body('remaining_g').isFloat({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const db = getDb();
    const { brand, material, color_name, color_hex, diameter_mm, full_weight_g, remaining_g, cost_cad, reorder_at_g, auto_reorder, reorder_qty, vendor_id, notes } = req.body;
    const result = db.prepare(`INSERT INTO filament_spools (brand, material, color_name, color_hex, diameter_mm, full_weight_g, remaining_g, cost_cad, reorder_at_g, auto_reorder, reorder_qty, vendor_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(brand, material, color_name, color_hex ?? '#888888', diameter_mm ?? 1.75, full_weight_g ?? 1000, remaining_g, cost_cad ?? 0, reorder_at_g ?? 200, auto_reorder ? 1 : 0, reorder_qty ?? 1, vendor_id ?? null, notes ?? null);
    const spool = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(result.lastInsertRowid);
    audit({ userId: req.user.id, userName: req.user.name, action: 'create', tableName: 'filament_spools', recordId: spool.id, newValue: spool });
    broadcast('filament:updated', spool);
    res.status(201).json(spool);
  }
);

router.patch('/:id', authenticate, authorize('owner', 'manager'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Spool not found' });
  const allowed = ['brand','material','color_name','color_hex','diameter_mm','full_weight_g','remaining_g','cost_cad','reorder_at_g','auto_reorder','reorder_qty','vendor_id','notes'];
  const updates = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No fields' });
  updates.updated_at = new Date().toISOString();
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE filament_spools SET ${sets} WHERE id = ?`).run(...Object.values(updates), existing.id);
  const updated = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(existing.id);
  audit({ userId: req.user.id, userName: req.user.name, action: 'update', tableName: 'filament_spools', recordId: existing.id, oldValue: existing, newValue: updates });
  broadcast('filament:updated', { ...updated, is_low: updated.remaining_g <= updated.reorder_at_g });
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('owner'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM filament_spools WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Spool not found' });
  db.prepare('DELETE FROM filament_spools WHERE id = ?').run(existing.id);
  audit({ userId: req.user.id, userName: req.user.name, action: 'delete', tableName: 'filament_spools', recordId: existing.id });
  broadcast('filament:deleted', { id: existing.id });
  res.json({ message: 'Deleted' });
});

module.exports = router;
