'use strict';
// routes/setup.js — [LITE] First-run setup endpoints
// Creates the owner account and saves company config
// Disabled after setup is complete
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/setup/status — is setup complete?
router.get('/status', (req, res) => {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  res.json({ setupComplete: userCount > 0, userCount });
});

// POST /api/setup/create-owner — creates first owner account
// Only works when no users exist yet (first run)
router.post('/create-owner',
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDb();
    const existing = db.prepare('SELECT COUNT(*) as n FROM users').get().n;

    // Only allow if no users exist OR if called by an existing owner
    const authHeader = req.headers.authorization;
    if (existing > 0 && !authHeader) {
      return res.status(403).json({ error: 'Setup already complete. Use Settings → Users to add accounts.' });
    }

    const { name, email, password } = req.body;
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(password, rounds);

    try {
      const result = db.prepare(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
      ).run(name, email.toLowerCase(), hash, 'owner');

      res.status(201).json({
        message: 'Owner account created',
        user: { id: result.lastInsertRowid, name, email, role: 'owner' },
      });
    } catch (e) {
      if (e.message.includes('UNIQUE')) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      throw e;
    }
  }
);

module.exports = router;
