const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');
const { audit } = require('../db/audit');
const { authenticate, authorize } = require('../middleware/auth');

const safe = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, is_active: u.is_active, created_at: u.created_at, last_login: u.last_login });

router.get('/', authenticate, authorize('owner'), (req, res) => {
  res.json(getDb().prepare('SELECT id, name, email, role, is_active, created_at, last_login FROM users ORDER BY created_at').all());
});

router.get('/:id', authenticate, authorize('owner', 'manager'), (req, res) => {
  const user = getDb().prepare('SELECT id, name, email, role, is_active, created_at, last_login FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.user.role === 'manager' && req.user.id !== user.id) return res.status(403).json({ error: 'Access denied' });
  res.json(user);
});

router.post('/', authenticate, authorize('owner'),
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['owner', 'manager', 'operator']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role } = req.body;
    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    const result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hash, role);
    audit({ userId: req.user.id, userName: req.user.name, action: 'create', tableName: 'users', recordId: result.lastInsertRowid, newValue: { name, email, role } });
    res.status(201).json(db.prepare('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid));
  }
);

router.patch('/:id', authenticate, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const isOwn = req.user.id === targetId;
  if (!isOwn && req.user.role !== 'owner') return res.status(403).json({ error: 'Access denied' });
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const allowed = req.user.role === 'owner'
    ? ['name', 'role', 'is_active']
    : ['name'];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = k === 'is_active' ? (req.body[k] ? 1 : 0) : req.body[k];
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), targetId);
  audit({ userId: req.user.id, userName: req.user.name, action: 'update', tableName: 'users', recordId: targetId, oldValue: safe(existing), newValue: updates });
  res.json(db.prepare('SELECT id, name, email, role, is_active, created_at, last_login FROM users WHERE id = ?').get(targetId));
});

router.delete('/:id', authenticate, authorize('owner'), (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  const db = getDb();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(targetId);
  audit({ userId: req.user.id, userName: req.user.name, action: 'delete', tableName: 'users', recordId: targetId, oldValue: safe(existing) });
  res.json({ message: 'User deactivated' });
});

module.exports = router;
