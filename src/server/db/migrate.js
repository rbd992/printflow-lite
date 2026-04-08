const { getDb } = require('./connection');
const logger = require('../services/logger');

const migrations = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT NOT NULL,
        email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK(role IN ('owner','manager','operator')),
        is_active     INTEGER NOT NULL DEFAULT 1,
        created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
        last_login    DATETIME
      );
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        website_url TEXT, notes TEXT, created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS filament_spools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL, material TEXT NOT NULL, color_name TEXT NOT NULL,
        color_hex TEXT NOT NULL DEFAULT '#888888', diameter_mm REAL NOT NULL DEFAULT 1.75,
        full_weight_g INTEGER NOT NULL DEFAULT 1000, remaining_g REAL NOT NULL,
        cost_cad REAL NOT NULL DEFAULT 0, reorder_at_g INTEGER NOT NULL DEFAULT 200,
        auto_reorder INTEGER NOT NULL DEFAULT 0, reorder_qty INTEGER NOT NULL DEFAULT 1,
        vendor_id INTEGER REFERENCES vendors(id), notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, category TEXT NOT NULL, description TEXT,
        quantity INTEGER NOT NULL DEFAULT 0, reorder_at INTEGER NOT NULL DEFAULT 1,
        unit_cost REAL, vendor_id INTEGER REFERENCES vendors(id),
        printer_brand TEXT, printer_model TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        printer_brand TEXT NOT NULL DEFAULT 'generic',
        printer_model TEXT,
        printer_name TEXT NOT NULL DEFAULT '',
        task_name TEXT NOT NULL,
        interval_days INTEGER NOT NULL,
        last_done_at DATE,
        next_due_at DATE,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT NOT NULL UNIQUE, customer_name TEXT NOT NULL,
        customer_email TEXT, platform TEXT NOT NULL DEFAULT 'direct',
        description TEXT NOT NULL, filament_id INTEGER REFERENCES filament_spools(id),
        filament_used_g REAL, price_cad REAL NOT NULL DEFAULT 0,
        shipping_cad REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'new'
          CHECK(status IN ('new','queued','quoted','confirmed','printing','printed','post-processing','qc','packed','shipped','delivered','paid','cancelled')),
        due_date DATE, printer_serial TEXT, tracking_number TEXT, carrier TEXT,
        notes TEXT, paid_at DATETIME, payment_method TEXT,
        is_historical INTEGER NOT NULL DEFAULT 0, historical_date DATE,
        is_recurring INTEGER NOT NULL DEFAULT 0,
        recurring_interval TEXT, recurring_next_date DATE, recurring_parent_id INTEGER,
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL, description TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('sales','materials','shipping','fees','maintenance','other')),
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        amount_cad REAL NOT NULL, hst_amount REAL NOT NULL DEFAULT 0,
        order_id INTEGER REFERENCES orders(id),
        receipt_url TEXT, receipt_filename TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS printers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, brand TEXT NOT NULL DEFAULT 'generic',
        model TEXT NOT NULL, serial TEXT NOT NULL UNIQUE,
        ip_address TEXT, access_code TEXT,
        connection_type TEXT NOT NULL DEFAULT 'network',
        has_ams INTEGER NOT NULL DEFAULT 0, ams_count INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1, notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT, phone TEXT, notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id), user_name TEXT,
        action TEXT NOT NULL CHECK(action IN ('create','update','delete','login','logout')),
        table_name TEXT, record_id INTEGER, old_value TEXT, new_value TEXT,
        ip_address TEXT, created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY, value TEXT NOT NULL,
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY, name TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_filament_material ON filament_spools(material);
    `,
  },
  {
    version: 2,
    name: 'add_camera_url_to_printers',
    sql: `ALTER TABLE printers ADD COLUMN camera_url TEXT;`,
  },
  {
    version: 3,
    name: 'default_vendors_and_settings',
    sql: `
      INSERT OR IGNORE INTO vendors (name, website_url, notes) VALUES
        ('Bambu Lab',          'https://bambulab.com',           'Printer & filament brand'),
        ('Polymaker',          'https://polymaker.com',          'Engineering filaments'),
        ('Hatchbox',           'https://hatchbox3d.com',         'Popular USA/CA brand'),
        ('eSUN',               'https://esun3d.com',             'Wide range, good value'),
        ('Overture',           'https://overture3d.com',         'Reliable everyday filaments'),
        ('Sunlu',              'https://sunlu.com',              'Budget-friendly'),
        ('Elegoo',             'https://elegoo.com',             'Resin & FDM filaments'),
        ('Prusament',          'https://prusament.com',          'Prusa high-quality filaments'),
        ('Inland',             'https://microcenter.com',        'Microcenter brand — US'),
        ('MatterHackers',      'https://matterhackers.com',      'US distributor'),
        ('3D Printing Canada', 'https://3dprintingcanada.com',   'Canadian distributor'),
        ('Amazon Basics',      'https://amazon.ca',              'Budget basics'),
        ('Generic / Other',    '',                               'Non-branded or mixed');

      INSERT OR IGNORE INTO app_settings (key, value) VALUES
        ('brand_filter', '["Bambu Lab","Polymaker","Hatchbox","eSUN","Overture","Sunlu","Elegoo","Prusament","Inland","MatterHackers","3D Printing Canada","Amazon Basics","Generic / Other"]');
    `,
  },
];

function runMigrations() {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY, name TEXT NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT (datetime('now'))
  )`);
  const applied = db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version);
  for (const m of migrations) {
    if (applied.includes(m.version)) continue;
    logger.info(`Migration ${m.version}: ${m.name}`);
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(m.version, m.name);
    })();
  }
}

module.exports = { runMigrations };
