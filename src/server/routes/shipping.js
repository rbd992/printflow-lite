const router = require('express').Router();
const { getDb } = require('../db/connection');
const { authenticate } = require('../middleware/auth');
const logger = require('../services/logger');
const { broadcast } = require('../services/socket');
const path = require('path');
const fs = require('fs');

// ── Ensure tables ───────────────────────────────────────────────────────────
(function migrate() {
  try {
    const db = getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS shipping_carriers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, carrier TEXT NOT NULL, name TEXT NOT NULL,
        enabled INTEGER DEFAULT 0, sandbox INTEGER DEFAULT 1, credentials TEXT DEFAULT '{}',
        sender_name TEXT DEFAULT '', sender_company TEXT DEFAULT '', sender_phone TEXT DEFAULT '',
        sender_address1 TEXT DEFAULT '', sender_address2 TEXT DEFAULT '', sender_city TEXT DEFAULT '',
        sender_province TEXT DEFAULT '', sender_postal TEXT DEFAULT '', sender_country TEXT DEFAULT 'CA',
        default_weight REAL DEFAULT 1.0, default_length REAL DEFAULT 25, default_width REAL DEFAULT 20, default_height REAL DEFAULT 15,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER,
        carrier TEXT NOT NULL, service_code TEXT DEFAULT '', service_name TEXT DEFAULT '',
        shipment_id TEXT DEFAULT '', tracking_number TEXT DEFAULT '',
        label_format TEXT DEFAULT 'PDF', label_path TEXT DEFAULT '', status TEXT DEFAULT 'created',
        rate_amount REAL DEFAULT 0, rate_currency TEXT DEFAULT 'CAD',
        recipient_name TEXT DEFAULT '', recipient_address TEXT DEFAULT '',
        recipient_city TEXT DEFAULT '', recipient_province TEXT DEFAULT '',
        recipient_postal TEXT DEFAULT '', recipient_country TEXT DEFAULT 'CA',
        parcel_weight REAL DEFAULT 1.0, parcel_length REAL DEFAULT 25,
        parcel_width REAL DEFAULT 20, parcel_height REAL DEFAULT 15,
        shipped_at DATETIME, delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS tracking_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT, shipment_id INTEGER NOT NULL,
        event_date TEXT DEFAULT '', description TEXT DEFAULT '', location TEXT DEFAULT '',
        status_code TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e) { logger.warn('Shipping tables migration:', e.message); }
})();

// ── Carrier CRUD ────────────────────────────────────────────────────────────
router.get('/carriers', authenticate, (req, res) => {
  try {
    const rows = getDb().prepare('SELECT * FROM shipping_carriers ORDER BY name').all();
    const safe = rows.map(c => {
      const creds = JSON.parse(c.credentials || '{}');
      const masked = {};
      Object.keys(creds).forEach(k => { masked[k] = typeof creds[k] === 'string' && creds[k].length > 4 ? '••••' + creds[k].slice(-4) : creds[k] ? '[set]' : ''; });
      return { ...c, credentials: masked };
    });
    res.json({ carriers: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/carriers/:id/full', authenticate, (req, res) => {
  try {
    const c = getDb().prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Carrier not found' });
    c.credentials = JSON.parse(c.credentials || '{}');
    res.json({ carrier: c });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/carriers', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { carrier, name, credentials, sandbox, sender_name, sender_company, sender_phone, sender_address1, sender_address2, sender_city, sender_province, sender_postal, sender_country } = req.body;
    const supported = ['canada_post','fedex','ups','purolator','dhl'];
    if (!supported.includes(carrier)) return res.status(400).json({ error: 'Unsupported carrier' });
    const existing = db.prepare('SELECT id FROM shipping_carriers WHERE carrier = ?').get(carrier);
    if (existing) return res.status(409).json({ error: `${carrier} already configured` });
    const r = db.prepare(`INSERT INTO shipping_carriers (carrier, name, credentials, sandbox, enabled, sender_name, sender_company, sender_phone, sender_address1, sender_address2, sender_city, sender_province, sender_postal, sender_country) VALUES (?,?,?,?,1,?,?,?,?,?,?,?,?,?)`)
      .run(carrier, name||carrier, JSON.stringify(credentials||{}), sandbox?1:0, sender_name||'', sender_company||'', sender_phone||'', sender_address1||'', sender_address2||'', sender_city||'', sender_province||'', sender_postal||'', sender_country||'CA');
    res.status(201).json(db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(r.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/carriers/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Carrier not found' });
    const fields = ['name','enabled','sandbox','sender_name','sender_company','sender_phone','sender_address1','sender_address2','sender_city','sender_province','sender_postal','sender_country','default_weight','default_length','default_width','default_height'];
    const updates = [], values = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }});
    if (req.body.credentials) {
      const merged = { ...JSON.parse(existing.credentials||'{}'), ...req.body.credentials };
      updates.push('credentials = ?'); values.push(JSON.stringify(merged));
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_at = CURRENT_TIMESTAMP'); values.push(req.params.id);
    db.prepare(`UPDATE shipping_carriers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/carriers/:id', authenticate, (req, res) => {
  try { getDb().prepare('DELETE FROM shipping_carriers WHERE id = ?').run(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/carriers/:id/test', authenticate, (req, res) => {
  try {
    const c = getDb().prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
    if (!c) return res.status(404).json({ error: 'Carrier not found' });
    const creds = JSON.parse(c.credentials || '{}');
    const required = { canada_post: ['apiUsername','apiPassword','customerNumber'], fedex: ['clientId','clientSecret','accountNumber'], ups: ['clientId','clientSecret','accountNumber'], purolator: ['activationKey','password','billingAccount'], dhl: ['apiUsername','apiPassword','accountNumber'] };
    const missing = (required[c.carrier]||[]).filter(f => !creds[f]);
    if (missing.length) return res.json({ success: false, error: `Missing: ${missing.join(', ')}` });
    res.json({ success: true, message: 'Credentials present — use Get Rates to fully test.' });
  } catch (e) { res.json({ success: false, error: e.message }); }
});

// ── Shipments ───────────────────────────────────────────────────────────────
router.get('/shipments', authenticate, (req, res) => {
  try {
    const db = getDb();
    let q = 'SELECT * FROM shipments', p = [];
    if (req.query.order_id) { q += ' WHERE order_id = ?'; p.push(req.query.order_id); }
    q += ' ORDER BY created_at DESC';
    if (req.query.limit) { q += ' LIMIT ?'; p.push(parseInt(req.query.limit)); }
    res.json({ shipments: db.prepare(q).all(...p) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/shipments/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Shipment not found' });
    const events = db.prepare('SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY event_date DESC').all(s.id);
    res.json({ shipment: s, events });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/shipments', authenticate, (req, res) => {
  try {
    const db = getDb(); const d = req.body;
    const r = db.prepare(`INSERT INTO shipments (order_id, carrier, service_code, service_name, shipment_id, tracking_number, label_format, label_path, status, rate_amount, rate_currency, recipient_name, recipient_address, recipient_city, recipient_province, recipient_postal, recipient_country, parcel_weight, parcel_length, parcel_width, parcel_height) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(d.order_id||null, d.carrier, d.service_code||'', d.service_name||'', d.shipment_id||'', d.tracking_number||'', d.label_format||'PDF', d.label_path||'', d.status||'created', d.rate_amount||0, d.rate_currency||'CAD', d.recipient_name||'', d.recipient_address||'', d.recipient_city||'', d.recipient_province||'', d.recipient_postal||'', d.recipient_country||'CA', d.parcel_weight||1, d.parcel_length||25, d.parcel_width||20, d.parcel_height||15);
    if (d.order_id && d.tracking_number) {
      try { db.prepare('UPDATE orders SET tracking_number = ?, carrier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(d.tracking_number, d.carrier, d.order_id); } catch {}
    }
    const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(r.lastInsertRowid);
    broadcast('shipping:created', shipment);
    res.status(201).json({ shipment });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/shipments/:id', authenticate, (req, res) => {
  try {
    const db = getDb(); const updates = [], values = [];
    ['status','tracking_number','label_path','shipped_at','delivered_at'].forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_at = CURRENT_TIMESTAMP'); values.push(req.params.id);
    db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Tracking events ─────────────────────────────────────────────────────────
router.post('/shipments/:id/tracking', authenticate, (req, res) => {
  try {
    const db = getDb(); const { events } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be array' });
    const stmt = db.prepare('INSERT INTO tracking_events (shipment_id, event_date, description, location, status_code) VALUES (?,?,?,?,?)');
    db.transaction(() => { events.forEach(e => stmt.run(req.params.id, e.date||'', e.description||'', e.location||'', e.status||'')); })();
    res.json({ success: true, count: events.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Rate quotes (proxy to renderer-side carrier APIs) ───────────────────────
router.post('/rates', authenticate, (req, res) => {
  // Rate fetching happens client-side via ShippingService.js
  // This endpoint stores/returns cached rates if needed
  res.json({ message: 'Use client-side ShippingService.js for live rate queries' });
});

// ── Meta ────────────────────────────────────────────────────────────────────
router.get('/meta/carriers', (req, res) => {
  res.json({ supported: [
    { id: 'canada_post', name: 'Canada Post', country: 'CA' },
    { id: 'fedex', name: 'FedEx', country: 'US' },
    { id: 'ups', name: 'UPS', country: 'US' },
    { id: 'purolator', name: 'Purolator', country: 'CA' },
    { id: 'dhl', name: 'DHL Express', country: 'DE' },
  ]});
});

module.exports = router;
