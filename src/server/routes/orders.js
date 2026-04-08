const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');
const { audit } = require('../db/audit');
const { authenticate, authorize } = require('../middleware/auth');
const { broadcast } = require('../services/socket');

const VALID_STATUSES = ['new','queued','quoted','confirmed','printing','printed','post-processing','qc','packed','shipped','delivered','paid','cancelled'];

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { status, platform, limit = 100, offset = 0, search } = req.query;
  let sql = `SELECT o.*, u.name as created_by_name, f.color_name as filament_color, f.material as filament_material
             FROM orders o
             LEFT JOIN users u ON o.created_by = u.id
             LEFT JOIN filament_spools f ON o.filament_id = f.id
             WHERE 1=1`;
  const params = [];
  if (status)   { sql += ' AND o.status = ?';   params.push(status); }
  if (platform) { sql += ' AND o.platform = ?'; params.push(platform); }
  if (search)   { sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.description LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', authenticate, (req, res) => {
  const order = getDb().prepare(`
    SELECT o.*, u.name as created_by_name, f.color_name as filament_color, f.material as filament_material, f.color_hex
    FROM orders o LEFT JOIN users u ON o.created_by = u.id LEFT JOIN filament_spools f ON o.filament_id = f.id
    WHERE o.id = ?`).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/', authenticate, authorize('owner', 'manager'),
  body('customer_name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('price_cad').isFloat({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const db = getDb();
    const { customer_name, customer_email, platform = 'direct', description, filament_id, price_cad, shipping_cad = 0, due_date, notes } = req.body;
    const count = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;
    const order_number = `#${String(count + 1001).padStart(4, '0')}`;
    const result = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_email, platform, description, filament_id, price_cad, shipping_cad, due_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(order_number, customer_name, customer_email ?? null, platform, description, filament_id ?? null, price_cad, shipping_cad, due_date ?? null, notes ?? null, req.user.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    db.prepare(`INSERT INTO transactions (date, description, category, type, amount_cad, hst_amount, order_id, created_by) VALUES (date('now'), ?, 'sales', 'income', ?, ?, ?, ?)`)
      .run(`Order ${order_number} — ${customer_name}`, price_cad, parseFloat((price_cad * 0.13).toFixed(2)), order.id, req.user.id);
    audit({ userId: req.user.id, userName: req.user.name, action: 'create', tableName: 'orders', recordId: order.id, newValue: order });
    broadcast('order:created', order);
    res.status(201).json(order);
  }
);

router.patch('/:id', authenticate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  const isOperator = req.user.role === 'operator';
  const allowed = isOperator ? ['status', 'notes'] : ['customer_name','customer_email','platform','description','filament_id','filament_used_g','price_cad','shipping_cad','due_date','status','tracking_number','carrier','printer_serial','notes','paid_at','payment_method'];
  const updates = {};
  for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  updates.updated_at = new Date().toISOString();
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE orders SET ${sets} WHERE id = ?`).run(...Object.values(updates), existing.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(existing.id);
  audit({ userId: req.user.id, userName: req.user.name, action: 'update', tableName: 'orders', recordId: existing.id, oldValue: existing, newValue: updates });
  broadcast('order:updated', updated);
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('owner'), (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found' });
  try {
    db.pragma('foreign_keys = OFF');
    db.prepare('DELETE FROM transactions WHERE order_id = ?').run(existing.id);
    db.prepare('DELETE FROM orders WHERE id = ?').run(existing.id);
  } finally { db.pragma('foreign_keys = ON'); }
  audit({ userId: req.user.id, userName: req.user.name, action: 'delete', tableName: 'orders', recordId: existing.id, oldValue: existing });
  broadcast('order:deleted', { id: existing.id });
  res.json({ message: 'Order deleted' });
});

module.exports = router;
