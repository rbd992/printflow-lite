// [BOTH] stub routes — minimal implementations for Lite
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => res.json([]));
router.post('/', authenticate, (req, res) => res.status(201).json({ id: Date.now(), ...req.body }));

module.exports = router;
