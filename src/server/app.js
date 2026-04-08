'use strict';
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const logger     = require('./services/logger');
const { getDb }  = require('./db/connection');

// Routes — shared with enterprise where marked [BOTH]
const authRoutes         = require('./routes/auth');
const setupRoutes        = require('./routes/setup');       // [LITE] first-run setup
const userRoutes         = require('./routes/users');
const filamentRoutes     = require('./routes/filament');
const partsRoutes        = require('./routes/parts');
const orderRoutes        = require('./routes/orders');
const dashboardRoutes    = require('./routes/dashboard');
const auditRoutes        = require('./routes/audit');
const printerRoutes      = require('./routes/printers');
const transactionRoutes  = require('./routes/transactions');
const shippingRoutes     = require('./routes/shipping');
const settingsRoutes     = require('./routes/settings');
const jobsRoutes         = require('./routes/jobs');
const customersRoutes    = require('./routes/customers');
const notificationsRoutes = require('./routes/notifications');
const maintenanceRoutes  = require('./routes/maintenance'); // [BOTH] brand-agnostic

const app = express();

app.use(helmet());

// Lite: only allow localhost origins
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin.startsWith('file://') || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
      return cb(null, true);
    }
    cb(new Error('CORS: external origin not allowed in Lite mode'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 2000, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/setup',         setupRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/filament',      filamentRoutes);
app.use('/api/parts',         partsRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/audit',         auditRoutes);
app.use('/api/printers',      printerRoutes);
app.use('/api/transactions',  transactionRoutes);
app.use('/api/shipping',      shippingRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/jobs',          jobsRoutes);
app.use('/api/customers',     customersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/maintenance',   maintenanceRoutes);

// Health — used by main.js to know when server is ready
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'lite', ts: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
