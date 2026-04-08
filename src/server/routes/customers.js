// [BOTH] customers route — copied from enterprise
const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  try {
    const customers = getDb().prepare(`SELECT c.*, COUNT(o.id) as order_count, COALESCE(SUM(o.price_cad),0) as total_spent, MAX(o.created_at) as last_order FROM customers c LEFT JOIN orders o ON (LOWER(o.customer_email)=LOWER(c.email) OR LOWER(o.customer_name)=LOWER(c.name)) GROUP BY c.id ORDER BY total_spent DESC`).all();
    res.json(customers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { name, email, phone, address, city, province, postal_code, notes, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = getDb().prepare(`INSERT INTO customers (name, email, phone, address, city, province, postal_code, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(name, email||null, phone||null, address||null, city||null, province||'ON', postal_code||null, notes||null, tags||null);
    res.status(201).json(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, (req, res) => {
  try {
    const { name, email, phone, address, city, province, postal_code, notes, tags } = req.body;
    getDb().prepare(`UPDATE customers SET name=?,email=?,phone=?,address=?,city=?,province=?,postal_code=?,notes=?,tags=?,updated_at=datetime('now') WHERE id=?`)
      .run(name, email||null, phone||null, address||null, city||null, province||'ON', postal_code||null, notes||null, tags||null, req.params.id);
    res.json(getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    getDb().prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
