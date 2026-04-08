const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');
const { audit } = require('../db/audit');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');

router.post('/login',
  body('email').isEmail().trim(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    audit({ userId: user.id, userName: user.name, action: 'login', ipAddress: req.ip });
    logger.info(`Login: ${user.name} (${user.role})`);
    res.json({ token, user: payload });
  }
);

router.post('/logout', authenticate, (req, res) => {
  audit({ userId: req.user.id, userName: req.user.name, action: 'logout', ipAddress: req.ip });
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, name, email, role, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.post('/refresh', authenticate, (req, res) => {
  const { id, name, email, role } = req.user;
  const token = jwt.sign({ id, name, email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token });
});

router.post('/change-password', authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const valid = await bcrypt.compare(req.body.currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(req.body.newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
    audit({ userId: user.id, userName: user.name, action: 'update', tableName: 'users', recordId: user.id });
    res.json({ message: 'Password changed successfully' });
  }
);

module.exports = router;
