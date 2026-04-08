'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../db/connection');

// GET /api/setup/status
router.get('/status', (req, res) => {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  res.json({ setupComplete: userCount > 0, userCount });
});

// POST /api/setup/create-owner — no auth required, only works when zero users exist
router.post('/create-owner',
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const db = getDb();
    const existing = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
    if (existing > 0) {
      return res.status(403).json({ error: 'Setup already complete. Use Settings → Users to add accounts.' });
    }

    const { name, email, password, companyConfig } = req.body;
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(password, rounds);

    try {
      db.transaction(() => {
        const result = db.prepare(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
        ).run(name, email.toLowerCase(), hash, 'owner');

        // Save company config during setup (no auth needed here)
        if (companyConfig) {
          db.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
            .run('company_config', JSON.stringify(companyConfig));
        }
      })();

      res.status(201).json({
        message: 'Owner account created',
        user: { name, email, role: 'owner' },
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
