'use strict';
// routes/maintenance.js — [BOTH] Brand-agnostic printer maintenance
const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/maintenance — list tasks (filter by printer_brand if provided)
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { printer_brand, printer_model } = req.query;
  let sql = 'SELECT * FROM maintenance_tasks WHERE 1=1';
  const params = [];
  if (printer_brand) { sql += ' AND (printer_brand = ? OR printer_brand = ?)'; params.push(printer_brand, 'generic'); }
  if (printer_model) { sql += ' AND (printer_model = ? OR printer_model IS NULL)'; params.push(printer_model); }
  sql += ' ORDER BY next_due_at ASC, task_name ASC';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/maintenance — create task
router.post('/', authenticate, authorize('owner', 'manager'),
  (req, res) => {
    const db = getDb();
    const { printer_brand, printer_model, printer_name, task_name, interval_days, notes } = req.body;
    if (!task_name || !interval_days) return res.status(400).json({ error: 'task_name and interval_days required' });

    const today = new Date().toISOString().split('T')[0];
    const next  = new Date(Date.now() + interval_days * 86400000).toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO maintenance_tasks (printer_brand, printer_model, printer_name, task_name, interval_days, next_due_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(printer_brand || 'generic', printer_model || null, printer_name || '', task_name, interval_days, next, notes || null);

    res.status(201).json(db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(result.lastInsertRowid));
  }
);

// PATCH /api/maintenance/:id/done — mark task as done, advance next_due_at
router.patch('/:id/done', authenticate, (req, res) => {
  const db = getDb();
  const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const today = new Date().toISOString().split('T')[0];
  const next  = new Date(Date.now() + task.interval_days * 86400000).toISOString().split('T')[0];

  db.prepare('UPDATE maintenance_tasks SET last_done_at = ?, next_due_at = ? WHERE id = ?').run(today, next, task.id);
  res.json(db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(task.id));
});

// DELETE /api/maintenance/:id
router.delete('/:id', authenticate, authorize('owner', 'manager'), (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM maintenance_tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
