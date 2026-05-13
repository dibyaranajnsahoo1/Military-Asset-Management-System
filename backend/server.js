const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

// ─── Connect Database ──────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased for development
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ─── General Middleware ────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/bases', require('./routes/bases'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/expenditures', require('./routes/expenditures'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit-logs', require('./routes/auditLogs'));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'MAMS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 MAMS Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
