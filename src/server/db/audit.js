const { getDb } = require('./connection');

function audit(opts) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (user_id, user_name, action, table_name, record_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      opts.userId    ?? null, opts.userName  ?? null,
      opts.action,
      opts.tableName ?? null, opts.recordId  ?? null,
      opts.oldValue  != null ? JSON.stringify(opts.oldValue)  : null,
      opts.newValue  != null ? JSON.stringify(opts.newValue)  : null,
      opts.ipAddress ?? null,
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { audit };
