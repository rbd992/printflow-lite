// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — shipping.js (Server Route)
// REST API for multi-carrier shipping management
// Place in: src/server/routes/shipping.js
// ──────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

function ensureShippingTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_carriers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier       TEXT NOT NULL,
      name          TEXT NOT NULL,
      enabled       INTEGER DEFAULT 0,
      sandbox       INTEGER DEFAULT 1,
      credentials   TEXT DEFAULT '{}',
      sender_name   TEXT DEFAULT '',
      sender_company TEXT DEFAULT '',
      sender_phone  TEXT DEFAULT '',
      sender_address1 TEXT DEFAULT '',
      sender_address2 TEXT DEFAULT '',
      sender_city   TEXT DEFAULT '',
      sender_province TEXT DEFAULT '',
      sender_postal TEXT DEFAULT '',
      sender_country TEXT DEFAULT 'CA',
      default_parcel_weight  REAL DEFAULT 1.0,
      default_parcel_length  REAL DEFAULT 25,
      default_parcel_width   REAL DEFAULT 20,
      default_parcel_height  REAL DEFAULT 15,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id        INTEGER,
      carrier         TEXT NOT NULL,
      service_code    TEXT DEFAULT '',
      service_name    TEXT DEFAULT '',
      shipment_id     TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      label_format    TEXT DEFAULT 'PDF',
      label_path      TEXT DEFAULT '',
      status          TEXT DEFAULT 'created',
      rate_amount     REAL DEFAULT 0,
      rate_currency   TEXT DEFAULT 'CAD',
      recipient_name  TEXT DEFAULT '',
      recipient_address TEXT DEFAULT '',
      recipient_city  TEXT DEFAULT '',
      recipient_province TEXT DEFAULT '',
      recipient_postal TEXT DEFAULT '',
      recipient_country TEXT DEFAULT 'CA',
      parcel_weight   REAL DEFAULT 1.0,
      parcel_length   REAL DEFAULT 25,
      parcel_width    REAL DEFAULT 20,
      parcel_height   REAL DEFAULT 15,
      shipped_at      DATETIME,
      delivered_at    DATETIME,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id   INTEGER NOT NULL,
      event_date    TEXT DEFAULT '',
      description   TEXT DEFAULT '',
      location      TEXT DEFAULT '',
      status_code   TEXT DEFAULT '',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
    );
  `);
}

module.exports = function(db, io, labelsDir) {
  ensureShippingTables(db);

  // Ensure labels directory exists
  const labelBasePath = labelsDir || path.join(process.cwd(), 'data', 'labels');
  try { fs.mkdirSync(labelBasePath, { recursive: true }); } catch {}

  // ════════════════════════════════════════════════════════════════════════
  // CARRIER CONFIGURATION
  // ════════════════════════════════════════════════════════════════════════

  // List all configured carriers
  router.get('/carriers', (req, res) => {
    try {
      const carriers = db.prepare('SELECT * FROM shipping_carriers ORDER BY name ASC').all();
      // Mask sensitive credentials
      const safe = carriers.map(c => {
        const creds = JSON.parse(c.credentials || '{}');
        const masked = {};
        Object.keys(creds).forEach(k => {
          masked[k] = typeof creds[k] === 'string' && creds[k].length > 4
            ? '••••' + creds[k].slice(-4)
            : creds[k] ? '[set]' : '';
        });
        return { ...c, credentials: masked };
      });
      res.json({ carriers: safe });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get carrier with full credentials (internal use / for making API calls)
  router.get('/carriers/:id/full', (req, res) => {
    try {
      const carrier = db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
      if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
      carrier.credentials = JSON.parse(carrier.credentials || '{}');
      res.json({ carrier });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add / configure a carrier
  router.post('/carriers', (req, res) => {
    try {
      const { carrier, name, credentials, sandbox, sender_name, sender_company,
        sender_phone, sender_address1, sender_address2, sender_city,
        sender_province, sender_postal, sender_country,
        default_parcel_weight, default_parcel_length, default_parcel_width, default_parcel_height } = req.body;

      const supported = ['canada_post', 'fedex', 'ups', 'purolator', 'dhl'];
      if (!supported.includes(carrier)) {
        return res.status(400).json({ error: `Unsupported carrier. Supported: ${supported.join(', ')}` });
      }

      // Check if this carrier is already configured
      const existing = db.prepare('SELECT id FROM shipping_carriers WHERE carrier = ?').get(carrier);
      if (existing) {
        return res.status(409).json({ error: `${carrier} is already configured. Use PUT to update.` });
      }

      const stmt = db.prepare(`
        INSERT INTO shipping_carriers (carrier, name, credentials, sandbox, enabled,
          sender_name, sender_company, sender_phone, sender_address1, sender_address2,
          sender_city, sender_province, sender_postal, sender_country,
          default_parcel_weight, default_parcel_length, default_parcel_width, default_parcel_height)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        carrier, name || carrier, JSON.stringify(credentials || {}), sandbox ? 1 : 0,
        sender_name || '', sender_company || '', sender_phone || '',
        sender_address1 || '', sender_address2 || '', sender_city || '',
        sender_province || '', sender_postal || '', sender_country || 'CA',
        default_parcel_weight || 1.0, default_parcel_length || 25,
        default_parcel_width || 20, default_parcel_height || 15
      );

      const created = db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(result.lastInsertRowid);
      io?.emit('shipping:carrier_added', { carrier });
      res.status(201).json({ carrier: { ...created, credentials: '[saved]' } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update carrier config
  router.put('/carriers/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Carrier not found' });

      const fields = [
        'name', 'enabled', 'sandbox', 'sender_name', 'sender_company',
        'sender_phone', 'sender_address1', 'sender_address2', 'sender_city',
        'sender_province', 'sender_postal', 'sender_country',
        'default_parcel_weight', 'default_parcel_length', 'default_parcel_width', 'default_parcel_height'
      ];

      const updates = [];
      const values = [];

      fields.forEach(f => {
        if (req.body[f] !== undefined) {
          updates.push(`${f} = ?`);
          values.push(req.body[f]);
        }
      });

      // Handle credentials separately (merge, don't replace)
      if (req.body.credentials) {
        const existingCreds = JSON.parse(existing.credentials || '{}');
        const merged = { ...existingCreds, ...req.body.credentials };
        updates.push('credentials = ?');
        values.push(JSON.stringify(merged));
      }

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);

      db.prepare(`UPDATE shipping_carriers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete carrier
  router.delete('/carriers/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM shipping_carriers WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Test carrier connection
  router.post('/carriers/:id/test', async (req, res) => {
    try {
      const carrier = db.prepare('SELECT * FROM shipping_carriers WHERE id = ?').get(req.params.id);
      if (!carrier) return res.status(404).json({ error: 'Carrier not found' });

      // Just verify that the credentials are present and non-empty
      const creds = JSON.parse(carrier.credentials || '{}');
      const requiredFields = {
        canada_post: ['apiUsername', 'apiPassword', 'customerNumber'],
        fedex: ['clientId', 'clientSecret', 'accountNumber'],
        ups: ['clientId', 'clientSecret', 'accountNumber'],
        purolator: ['activationKey', 'password', 'billingAccount'],
        dhl: ['apiUsername', 'apiPassword', 'accountNumber'],
      };

      const missing = (requiredFields[carrier.carrier] || []).filter(f => !creds[f]);
      if (missing.length > 0) {
        return res.json({ success: false, error: `Missing required credentials: ${missing.join(', ')}` });
      }

      res.json({ success: true, message: 'Credentials present. Use "Get Rates" to fully test the API connection.' });
    } catch (err) {
      res.json({ success: false, error: err.message });
    }
  });


  // ════════════════════════════════════════════════════════════════════════
  // SHIPMENTS
  // ════════════════════════════════════════════════════════════════════════

  // List shipments (with optional order_id filter)
  router.get('/shipments', (req, res) => {
    try {
      let query = 'SELECT * FROM shipments';
      const params = [];
      if (req.query.order_id) {
        query += ' WHERE order_id = ?';
        params.push(req.query.order_id);
      }
      query += ' ORDER BY created_at DESC';
      if (req.query.limit) {
        query += ' LIMIT ?';
        params.push(parseInt(req.query.limit));
      }
      const shipments = db.prepare(query).all(...params);
      res.json({ shipments });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single shipment
  router.get('/shipments/:id', (req, res) => {
    try {
      const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
      if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
      const events = db.prepare('SELECT * FROM tracking_events WHERE shipment_id = ? ORDER BY event_date DESC').all(shipment.id);
      res.json({ shipment, events });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record a new shipment (after creating it via carrier API on the client side)
  router.post('/shipments', (req, res) => {
    try {
      const d = req.body;
      const stmt = db.prepare(`
        INSERT INTO shipments (order_id, carrier, service_code, service_name,
          shipment_id, tracking_number, label_format, label_path, status,
          rate_amount, rate_currency, recipient_name, recipient_address,
          recipient_city, recipient_province, recipient_postal, recipient_country,
          parcel_weight, parcel_length, parcel_width, parcel_height)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        d.order_id || null, d.carrier, d.service_code || '', d.service_name || '',
        d.shipment_id || '', d.tracking_number || '', d.label_format || 'PDF',
        d.label_path || '', d.status || 'created',
        d.rate_amount || 0, d.rate_currency || 'CAD',
        d.recipient_name || '', d.recipient_address || '',
        d.recipient_city || '', d.recipient_province || '',
        d.recipient_postal || '', d.recipient_country || 'CA',
        d.parcel_weight || 1.0, d.parcel_length || 25,
        d.parcel_width || 20, d.parcel_height || 15
      );

      // If order_id is set, update the order's tracking info
      if (d.order_id && d.tracking_number) {
        try {
          db.prepare(`UPDATE orders SET tracking_number = ?, carrier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
            .run(d.tracking_number, d.carrier, d.order_id);
        } catch {} // Orders table may not have these columns yet
      }

      const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(result.lastInsertRowid);
      io?.emit('shipping:created', shipment);
      res.status(201).json({ shipment });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update shipment status
  router.put('/shipments/:id', (req, res) => {
    try {
      const updates = [];
      const values = [];
      ['status', 'tracking_number', 'label_path', 'shipped_at', 'delivered_at'].forEach(f => {
        if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
      });
      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);
      db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
      io?.emit('shipping:updated', shipment);
      res.json({ shipment });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save label file
  router.post('/shipments/:id/label', (req, res) => {
    try {
      const { data, format, filename } = req.body;
      if (!data) return res.status(400).json({ error: 'No label data provided' });

      const fn = filename || `label-${req.params.id}-${Date.now()}.${format === 'ZPL' ? 'zpl' : 'pdf'}`;
      const filepath = path.join(labelBasePath, fn);

      // data is base64 encoded
      fs.writeFileSync(filepath, Buffer.from(data, 'base64'));

      db.prepare('UPDATE shipments SET label_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(filepath, req.params.id);

      res.json({ success: true, path: filepath, filename: fn });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download label
  router.get('/shipments/:id/label/download', (req, res) => {
    try {
      const shipment = db.prepare('SELECT label_path, label_format FROM shipments WHERE id = ?').get(req.params.id);
      if (!shipment?.label_path || !fs.existsSync(shipment.label_path)) {
        return res.status(404).json({ error: 'Label not found' });
      }
      const mime = shipment.label_format === 'ZPL' ? 'text/plain' : 'application/pdf';
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="label-${req.params.id}.${shipment.label_format === 'ZPL' ? 'zpl' : 'pdf'}"`);
      res.sendFile(shipment.label_path);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ════════════════════════════════════════════════════════════════════════
  // TRACKING EVENTS
  // ════════════════════════════════════════════════════════════════════════

  router.post('/shipments/:id/tracking', (req, res) => {
    try {
      const { events } = req.body;
      if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be an array' });

      const stmt = db.prepare(`
        INSERT INTO tracking_events (shipment_id, event_date, description, location, status_code)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insert = db.transaction((evts) => {
        evts.forEach(e => stmt.run(req.params.id, e.date || '', e.description || '', e.location || '', e.status || ''));
      });
      insert(events);

      // Update shipment status to latest event
      if (events.length > 0) {
        const latest = events[0];
        db.prepare('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(latest.status || latest.description || 'in_transit', req.params.id);
      }

      res.json({ success: true, count: events.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ════════════════════════════════════════════════════════════════════════
  // META / REFERENCE
  // ════════════════════════════════════════════════════════════════════════

  router.get('/meta/carriers', (req, res) => {
    res.json({
      supported: [
        { id: 'canada_post', name: 'Canada Post', country: 'CA', features: ['rates', 'shipment', 'label', 'tracking', 'manifest'] },
        { id: 'fedex',       name: 'FedEx',       country: 'US', features: ['rates', 'shipment', 'label', 'tracking', 'address_validation'] },
        { id: 'ups',         name: 'UPS',         country: 'US', features: ['rates', 'shipment', 'label', 'tracking', 'address_validation'] },
        { id: 'purolator',   name: 'Purolator',   country: 'CA', features: ['rates', 'shipment', 'label', 'tracking'] },
        { id: 'dhl',         name: 'DHL Express',  country: 'DE', features: ['rates', 'shipment', 'label', 'tracking', 'customs'] },
      ],
    });
  });

  return router;
};
