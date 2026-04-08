// [BOTH] jobs route
const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  const orders = getDb().prepare(`SELECT * FROM orders WHERE status IN ('queued','printing','post-processing','qc') ORDER BY due_date ASC, created_at ASC`).all();
  res.json(orders);
});

module.exports = router;
