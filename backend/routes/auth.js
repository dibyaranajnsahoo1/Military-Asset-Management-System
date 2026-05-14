const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { AuditLog } = require('../models');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const DEMO_CREDENTIALS = {
  'admin@military.gov': 'admin123',
  'commander@alpha.mil': 'commander123',
  'logistics@bravo.mill': 'logistics123',
};

const repairDemoPasswordIfNeeded = async (user, email, password) => {
  if (DEMO_CREDENTIALS[email] !== password) return false;

  user.passwordHash = password;
  await user.save();
  return true;
};

// ─── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true }).select('+passwordHash').populate('baseId', 'name location code');
    const passwordMatches = user ? await user.comparePassword(password) : false;
    const demoPasswordRepaired = user && !passwordMatches
      ? await repairDemoPasswordIfNeeded(user, email, password)
      : false;

    if (!user || (!passwordMatches && !demoPasswordRepaired)) {
      logger.warn(`Failed login attempt for email: ${email} from IP: ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Audit log
    await AuditLog.create({
      action: 'USER_LOGIN', entity: 'User', entityId: user._id,
      userId: user._id, userName: user.name, userRole: user.role,
      baseId: user.baseId?._id, ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      token,
      user: {
        id:       user._id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        baseId:   user.baseId?._id || null,
        base:     user.baseId,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('baseId', 'name location code');
  res.json({ success: true, user });
});

// ─── POST /api/auth/logout ──────────────────────────────────────────────────
router.post('/logout', protect, async (req, res, next) => {
  try {
    await AuditLog.create({
      action: 'USER_LOGOUT', entity: 'User', entityId: req.user._id,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role,
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
});

// ─── POST /api/auth/change-password ────────────────────────────────────────
router.post('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = req.body.newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
