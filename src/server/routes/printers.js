// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — printers.js (Server Route)
// REST API endpoints for multi-brand printer management,
// cloud integrations, and camera proxy
// Place in: src/server/routes/printers.js
// ──────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

// ── Database Helpers ────────────────────────────────────────────────────────
// These assume the existing SQLite setup from PrintFlow Lite's db module

function ensurePrinterTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS printers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      brand         TEXT NOT NULL DEFAULT 'octoprint',
      model         TEXT DEFAULT '',
      host          TEXT DEFAULT '',
      port          INTEGER DEFAULT 80,
      api_key       TEXT DEFAULT '',
      access_code   TEXT DEFAULT '',
      serial_number TEXT DEFAULT '',
      password      TEXT DEFAULT '',
      status        TEXT DEFAULT 'offline',
      camera_enabled    INTEGER DEFAULT 0,
      camera_protocol   TEXT DEFAULT 'mjpeg',
      camera_url        TEXT DEFAULT '',
      camera_snapshot   TEXT DEFAULT '',
      camera_webrtc     TEXT DEFAULT '',
      camera_rtsp       TEXT DEFAULT '',
      notes         TEXT DEFAULT '',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cloud_connections (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      provider      TEXT NOT NULL,
      name          TEXT DEFAULT '',
      token         TEXT DEFAULT '',
      access_token  TEXT DEFAULT '',
      refresh_token TEXT DEFAULT '',
      folder_id     TEXT DEFAULT '',
      config        TEXT DEFAULT '{}',
      enabled       INTEGER DEFAULT 1,
      last_sync     DATETIME,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS printer_status_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id  INTEGER NOT NULL,
      state       TEXT DEFAULT 'unknown',
      progress    REAL DEFAULT 0,
      nozzle_temp REAL DEFAULT 0,
      nozzle_target REAL DEFAULT 0,
      bed_temp    REAL DEFAULT 0,
      bed_target  REAL DEFAULT 0,
      filename    TEXT DEFAULT '',
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS camera_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      printer_id  INTEGER NOT NULL,
      filename    TEXT NOT NULL,
      filepath    TEXT NOT NULL,
      file_size   INTEGER DEFAULT 0,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (printer_id) REFERENCES printers(id) ON DELETE CASCADE
    );
  `);
}


module.exports = function(db, io) {
  // Run migrations
  ensurePrinterTables(db);

  // ══════════════════════════════════════════════════════════════════════════
  // PRINTER CRUD
  // ══════════════════════════════════════════════════════════════════════════

  // List all printers
  router.get('/', (req, res) => {
    try {
      const printers = db.prepare('SELECT * FROM printers ORDER BY name ASC').all();
      res.json({ printers });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get single printer
  router.get('/:id', (req, res) => {
    try {
      const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
      if (!printer) return res.status(404).json({ error: 'Printer not found' });
      res.json({ printer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create printer
  router.post('/', (req, res) => {
    try {
      const {
        name, brand, model, host, port, api_key, access_code,
        serial_number, password, camera_enabled, camera_protocol,
        camera_url, camera_snapshot, camera_webrtc, camera_rtsp, notes,
      } = req.body;

      if (!name || !brand) {
        return res.status(400).json({ error: 'Name and brand are required' });
      }

      const supported = ['octoprint', 'klipper', 'bambulab', 'prusa', 'creality', 'duet', 'repetier'];
      if (!supported.includes(brand)) {
        return res.status(400).json({ error: `Unsupported brand. Supported: ${supported.join(', ')}` });
      }

      const stmt = db.prepare(`
        INSERT INTO printers (name, brand, model, host, port, api_key, access_code,
          serial_number, password, camera_enabled, camera_protocol,
          camera_url, camera_snapshot, camera_webrtc, camera_rtsp, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name, brand, model || '', host || '', port || 80,
        api_key || '', access_code || '', serial_number || '', password || '',
        camera_enabled ? 1 : 0, camera_protocol || 'mjpeg',
        camera_url || '', camera_snapshot || '', camera_webrtc || '',
        camera_rtsp || '', notes || ''
      );

      const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(result.lastInsertRowid);
      io?.emit('printer:created', printer);
      res.status(201).json({ printer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update printer
  router.put('/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Printer not found' });

      const fields = [
        'name', 'brand', 'model', 'host', 'port', 'api_key', 'access_code',
        'serial_number', 'password', 'status', 'camera_enabled', 'camera_protocol',
        'camera_url', 'camera_snapshot', 'camera_webrtc', 'camera_rtsp', 'notes',
      ];

      const updates = [];
      const values = [];
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(field === 'camera_enabled' ? (req.body[field] ? 1 : 0) : req.body[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);

      db.prepare(`UPDATE printers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
      io?.emit('printer:updated', printer);
      res.json({ printer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete printer
  router.delete('/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Printer not found' });

      db.prepare('DELETE FROM printers WHERE id = ?').run(req.params.id);
      io?.emit('printer:deleted', { id: parseInt(req.params.id) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // PRINTER STATUS LOGGING
  // ══════════════════════════════════════════════════════════════════════════

  // Log printer status (called by polling service)
  router.post('/:id/status', (req, res) => {
    try {
      const { state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename } = req.body;

      db.prepare(`
        INSERT INTO printer_status_log (printer_id, state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.params.id, state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename);

      // Update printer's current status
      db.prepare('UPDATE printers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(state, req.params.id);

      io?.emit('printer:status', { printerId: parseInt(req.params.id), state, progress, nozzle_temp, nozzle_target, bed_temp, bed_target, filename });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get status history for a printer
  router.get('/:id/status/history', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const history = db.prepare(
        'SELECT * FROM printer_status_log WHERE printer_id = ? ORDER BY recorded_at DESC LIMIT ?'
      ).all(req.params.id, limit);
      res.json({ history });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // PRINTER CONNECTION TEST
  // ══════════════════════════════════════════════════════════════════════════

  router.post('/:id/test', async (req, res) => {
    try {
      const printer = db.prepare('SELECT * FROM printers WHERE id = ?').get(req.params.id);
      if (!printer) return res.status(404).json({ error: 'Printer not found' });

      // Basic connectivity test — attempt to reach the printer's API
      const http = require('http');
      const url = `http://${printer.host}:${printer.port}`;

      const testPromise = new Promise((resolve, reject) => {
        const testReq = http.get(url, { timeout: 5000 }, (response) => {
          resolve({ reachable: true, statusCode: response.statusCode });
        });
        testReq.on('error', () => reject(new Error('unreachable')));
        testReq.on('timeout', () => { testReq.destroy(); reject(new Error('timeout')); });
      });

      const result = await testPromise;
      res.json({ success: true, ...result, brand: printer.brand });
    } catch (err) {
      res.json({ success: false, reachable: false, error: err.message });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // CLOUD CONNECTIONS
  // ══════════════════════════════════════════════════════════════════════════

  // List all cloud connections
  router.get('/cloud/connections', (req, res) => {
    try {
      const connections = db.prepare('SELECT * FROM cloud_connections ORDER BY provider ASC').all();
      // Mask tokens in response
      const safe = connections.map(c => ({
        ...c,
        token: c.token ? '••••' + c.token.slice(-4) : '',
        access_token: c.access_token ? '••••' + c.access_token.slice(-4) : '',
        refresh_token: c.refresh_token ? '[set]' : '',
      }));
      res.json({ connections: safe });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add cloud connection
  router.post('/cloud/connections', (req, res) => {
    try {
      const { provider, name, token, access_token, refresh_token, folder_id, config } = req.body;

      const supported = ['bambu_cloud', 'prusa_connect', 'creality_cloud', 'octoprint_anywhere', 'google_drive', 'dropbox', 's3'];
      if (!supported.includes(provider)) {
        return res.status(400).json({ error: `Unsupported provider. Supported: ${supported.join(', ')}` });
      }

      const stmt = db.prepare(`
        INSERT INTO cloud_connections (provider, name, token, access_token, refresh_token, folder_id, config)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        provider, name || provider,
        token || '', access_token || '', refresh_token || '',
        folder_id || '', JSON.stringify(config || {})
      );

      const connection = db.prepare('SELECT * FROM cloud_connections WHERE id = ?').get(result.lastInsertRowid);
      io?.emit('cloud:connected', { provider });
      res.status(201).json({ connection: { ...connection, token: '••••' + (token || '').slice(-4) } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update cloud connection
  router.put('/cloud/connections/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM cloud_connections WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Connection not found' });

      const fields = ['name', 'token', 'access_token', 'refresh_token', 'folder_id', 'config', 'enabled'];
      const updates = [];
      const values = [];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(field === 'config' ? JSON.stringify(req.body[field]) : req.body[field]);
        }
      });

      if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);

      db.prepare(`UPDATE cloud_connections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete cloud connection
  router.delete('/cloud/connections/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM cloud_connections WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Record sync timestamp
  router.post('/cloud/connections/:id/sync', (req, res) => {
    try {
      db.prepare('UPDATE cloud_connections SET last_sync = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // CAMERA SNAPSHOTS
  // ══════════════════════════════════════════════════════════════════════════

  // Save camera snapshot metadata
  router.post('/:id/camera/snapshot', (req, res) => {
    try {
      const { filename, filepath, file_size } = req.body;
      db.prepare(`
        INSERT INTO camera_snapshots (printer_id, filename, filepath, file_size)
        VALUES (?, ?, ?, ?)
      `).run(req.params.id, filename, filepath, file_size || 0);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get camera snapshots for a printer
  router.get('/:id/camera/snapshots', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const snapshots = db.prepare(
        'SELECT * FROM camera_snapshots WHERE printer_id = ? ORDER BY captured_at DESC LIMIT ?'
      ).all(req.params.id, limit);
      res.json({ snapshots });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // ══════════════════════════════════════════════════════════════════════════
  // SUPPORTED BRANDS (reference endpoint)
  // ══════════════════════════════════════════════════════════════════════════

  router.get('/meta/brands', (req, res) => {
    res.json({
      brands: [
        { id: 'octoprint',  name: 'OctoPrint',            auth: 'apikey',       defaultPort: 80,   camera: ['mjpeg', 'snapshot'] },
        { id: 'klipper',    name: 'Klipper / Moonraker',  auth: 'apikey',       defaultPort: 7125, camera: ['mjpeg', 'webrtc', 'hls', 'snapshot'] },
        { id: 'bambulab',   name: 'Bambu Lab',            auth: 'access_code',  defaultPort: 8883, camera: ['rtsp'] },
        { id: 'prusa',      name: 'Prusa Connect / Link', auth: 'apikey',       defaultPort: 80,   camera: ['snapshot', 'mjpeg'] },
        { id: 'creality',   name: 'Creality',             auth: 'token',        defaultPort: 9999, camera: ['mjpeg', 'snapshot'] },
        { id: 'duet',       name: 'Duet3D / RRF',         auth: 'password',     defaultPort: 80,   camera: ['mjpeg', 'snapshot'] },
        { id: 'repetier',   name: 'Repetier Server',      auth: 'apikey',       defaultPort: 3344, camera: ['mjpeg', 'snapshot'] },
      ],
      cloudProviders: [
        { id: 'bambu_cloud',        name: 'Bambu Cloud' },
        { id: 'prusa_connect',      name: 'Prusa Connect' },
        { id: 'creality_cloud',     name: 'Creality Cloud' },
        { id: 'octoprint_anywhere', name: 'OctoPrint Anywhere / Obico' },
        { id: 'google_drive',       name: 'Google Drive' },
        { id: 'dropbox',            name: 'Dropbox' },
        { id: 's3',                 name: 'Amazon S3' },
      ],
    });
  });


  return router;
};
