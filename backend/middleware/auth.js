const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuditLog } = require('../models');
const logger = require('../config/logger');

// ─── Verify JWT ─────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('baseId', 'name location');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn(`Invalid token attempt from IP: ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── Role-Based Access Control ────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logger.warn(`Unauthorized access attempt by ${req.user.email} (${req.user.role}) on ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
    });
  }
  next();
};

// ─── Base Scope Filter ────────────────────────────────────────────────────
// Ensures BC/LO only see their own base's data; Admin sees all
const scopeToBase = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    // Enforce base filter for non-admins
    req.baseScope = req.user.baseId?._id || req.user.baseId;
  } else if (req.query.baseId) {
    req.baseScope = req.query.baseId;
  } else {
    req.baseScope = null; // Admin sees all
  }
  next();
};

// ─── Audit Logger Middleware ───────────────────────────────────────────────
const auditLog = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    // Only log successful mutations
    if (body?.success && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      try {
        await AuditLog.create({
          action,
          entity,
          entityId: body?.data?._id,
          userId: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          baseId: req.user.baseId?._id || req.user.baseId,
          details: {
            method:  req.method,
            url:     req.originalUrl,
            body:    req.body,
            result:  body?.data,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      } catch (err) {
        logger.error(`Audit log write failed: ${err.message}`);
      }
    }
    return originalJson(body);
  };

  next();
};

module.exports = { protect, authorize, scopeToBase, auditLog };
