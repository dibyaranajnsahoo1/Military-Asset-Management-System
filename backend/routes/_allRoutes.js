// ============================================================
//  ALL ROUTES BUNDLED - each section exported separately
// ============================================================

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { protect, authorize, scopeToBase, auditLog } = require('../middleware/auth');
const { Base, Asset, Purchase, Transfer, Assignment, Expenditure, AuditLog } = require('../models');
const User = require('../models/User');

// ─── HELPER ────────────────────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

const buildDateFilter = (dateFrom, dateTo, field) => {
  const f = {};
  if (dateFrom || dateTo) {
    f[field] = {};
    if (dateFrom) f[field].$gte = new Date(dateFrom);
    if (dateTo)   f[field].$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }
  return f;
};

// ═══════════════════════════════════════════════════════════
//  BASES ROUTER
// ═══════════════════════════════════════════════════════════
const basesRouter = express.Router();
basesRouter.use(protect);

basesRouter.get('/', async (req, res, next) => {
  try {
    const bases = await Base.find({ isActive: true }).sort('name');
    res.json({ success: true, data: bases });
  } catch (e) { next(e); }
});

basesRouter.post('/', authorize('Admin'), [
  body('name').notEmpty().trim(),
  body('location').notEmpty().trim(),
  body('code').notEmpty().trim().toUpperCase(),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const base = await Base.create(req.body);
    res.status(201).json({ success: true, data: base });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
//  ASSETS ROUTER
// ═══════════════════════════════════════════════════════════
const assetsRouter = express.Router();
assetsRouter.use(protect, scopeToBase);

assetsRouter.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.baseScope)     filter.baseId = req.baseScope;
    if (req.query.type)    filter.type   = req.query.type;
    filter.isActive = true;
    const assets = await Asset.find(filter).populate('baseId', 'name code').sort('name');
    res.json({ success: true, count: assets.length, data: assets });
  } catch (e) { next(e); }
});

assetsRouter.post('/', authorize('Admin', 'BaseCommander'), [
  body('name').notEmpty().trim(),
  body('type').isIn(['Weapon', 'Vehicle', 'Ammunition']),
  body('baseId').notEmpty(),
  body('openingQty').isInt({ min: 0 }),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const asset = await Asset.create({ ...req.body, currentQty: req.body.openingQty });
    res.status(201).json({ success: true, data: asset });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
//  PURCHASES ROUTER
// ═══════════════════════════════════════════════════════════
const purchasesRouter = express.Router();
purchasesRouter.use(protect, scopeToBase);

purchasesRouter.get('/', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, assetType, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (req.baseScope) filter.baseId = req.baseScope;
    Object.assign(filter, buildDateFilter(dateFrom, dateTo, 'purchaseDate'));

    const purchases = await Purchase.find(filter)
      .populate('assetId', 'name type')
      .populate('baseId',  'name code')
      .populate('addedBy', 'name role')
      .sort('-purchaseDate')
      .skip((page - 1) * limit).limit(parseInt(limit));

    const filtered = assetType ? purchases.filter(p => p.assetId?.type === assetType) : purchases;
    const total = await Purchase.countDocuments(filter);

    res.json({ success: true, count: filtered.length, total, page: +page, data: filtered });
  } catch (e) { next(e); }
});

purchasesRouter.post('/',
  authorize('Admin', 'BaseCommander', 'LogisticsOfficer'),
  auditLog('CREATE_PURCHASE', 'Purchase'),
  [body('assetId').notEmpty(), body('baseId').notEmpty(), body('quantity').isInt({ min: 1 }), body('purchaseDate').isISO8601()],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      // Enforce base scope for non-admin
      if (req.user.role !== 'Admin' && String(req.body.baseId) !== String(req.baseScope)) {
        return res.status(403).json({ success: false, message: 'You can only record purchases for your own base.' });
      }
      const purchase = await Purchase.create({ ...req.body, addedBy: req.user._id });
      // Update asset currentQty
      await Asset.findByIdAndUpdate(req.body.assetId, { $inc: { currentQty: req.body.quantity } });
      const populated = await purchase.populate(['assetId', 'baseId', 'addedBy']);
      res.status(201).json({ success: true, data: populated });
    } catch (e) { next(e); }
  }
);

purchasesRouter.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const p = await Purchase.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Purchase not found.' });
    await Asset.findByIdAndUpdate(p.assetId, { $inc: { currentQty: -p.quantity } });
    res.json({ success: true, message: 'Purchase deleted.' });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
//  TRANSFERS ROUTER
// ═══════════════════════════════════════════════════════════
const transfersRouter = express.Router();
transfersRouter.use(protect, scopeToBase);

transfersRouter.get('/', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, assetType, page = 1, limit = 50 } = req.query;
    const dateF = buildDateFilter(dateFrom, dateTo, 'transferDate');
    let filter = { ...dateF };

    if (req.baseScope) {
      filter.$or = [{ fromBaseId: req.baseScope }, { toBaseId: req.baseScope }];
    }

    const transfers = await Transfer.find(filter)
      .populate('assetId',    'name type')
      .populate('fromBaseId', 'name code')
      .populate('toBaseId',   'name code')
      .populate('initiatedBy','name role')
      .sort('-transferDate')
      .skip((page - 1) * limit).limit(parseInt(limit));

    const filtered = assetType ? transfers.filter(t => t.assetId?.type === assetType) : transfers;
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (e) { next(e); }
});

transfersRouter.post('/',
  authorize('Admin', 'BaseCommander', 'LogisticsOfficer'),
  auditLog('CREATE_TRANSFER', 'Transfer'),
  [
    body('assetId').notEmpty(),
    body('fromBaseId').notEmpty(),
    body('toBaseId').notEmpty(),
    body('quantity').isInt({ min: 1 }),
    body('transferDate').isISO8601(),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      if (String(req.body.fromBaseId) === String(req.body.toBaseId)) {
        return res.status(400).json({ success: false, message: 'Source and destination bases must differ.' });
      }
      const transfer = await Transfer.create({ ...req.body, initiatedBy: req.user._id });
      // Adjust asset quantities
      await Asset.findByIdAndUpdate(req.body.assetId, { $inc: { currentQty: -req.body.quantity } });
      const populated = await transfer.populate(['assetId', 'fromBaseId', 'toBaseId', 'initiatedBy']);
      res.status(201).json({ success: true, data: populated });
    } catch (e) { next(e); }
  }
);

// ═══════════════════════════════════════════════════════════
//  ASSIGNMENTS ROUTER
// ═══════════════════════════════════════════════════════════
const assignmentsRouter = express.Router();
assignmentsRouter.use(protect, scopeToBase);

assignmentsRouter.get('/', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, assetType } = req.query;
    const filter = {};
    if (req.baseScope) filter.baseId = req.baseScope;
    Object.assign(filter, buildDateFilter(dateFrom, dateTo, 'assignmentDate'));

    const list = await Assignment.find(filter)
      .populate('assetId',   'name type')
      .populate('baseId',    'name code')
      .populate('createdBy', 'name')
      .sort('-assignmentDate');

    const result = assetType ? list.filter(a => a.assetId?.type === assetType) : list;
    res.json({ success: true, count: result.length, data: result });
  } catch (e) { next(e); }
});

assignmentsRouter.post('/',
  authorize('Admin', 'BaseCommander'),
  auditLog('CREATE_ASSIGNMENT', 'Assignment'),
  [body('assetId').notEmpty(), body('baseId').notEmpty(), body('quantity').isInt({ min: 1 }), body('assignedTo').notEmpty().trim(), body('assignmentDate').isISO8601()],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const a = await Assignment.create({ ...req.body, createdBy: req.user._id });
      const pop = await a.populate(['assetId', 'baseId', 'createdBy']);
      res.status(201).json({ success: true, data: pop });
    } catch (e) { next(e); }
  }
);

// ═══════════════════════════════════════════════════════════
//  EXPENDITURES ROUTER
// ═══════════════════════════════════════════════════════════
const expendituresRouter = express.Router();
expendituresRouter.use(protect, scopeToBase);

expendituresRouter.get('/', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, assetType } = req.query;
    const filter = {};
    if (req.baseScope) filter.baseId = req.baseScope;
    Object.assign(filter, buildDateFilter(dateFrom, dateTo, 'dateExpended'));

    const list = await Expenditure.find(filter)
      .populate('assetId',   'name type')
      .populate('baseId',    'name code')
      .populate('createdBy', 'name')
      .sort('-dateExpended');

    const result = assetType ? list.filter(e => e.assetId?.type === assetType) : list;
    res.json({ success: true, count: result.length, data: result });
  } catch (e) { next(e); }
});

expendituresRouter.post('/',
  authorize('Admin', 'BaseCommander'),
  auditLog('CREATE_EXPENDITURE', 'Expenditure'),
  [body('assetId').notEmpty(), body('baseId').notEmpty(), body('quantity').isInt({ min: 1 }), body('reason').notEmpty(), body('dateExpended').isISO8601()],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const e = await Expenditure.create({ ...req.body, createdBy: req.user._id });
      await Asset.findByIdAndUpdate(req.body.assetId, { $inc: { currentQty: -req.body.quantity } });
      const pop = await e.populate(['assetId', 'baseId', 'createdBy']);
      res.status(201).json({ success: true, data: pop });
    } catch (e) { next(e); }
  }
);

// ═══════════════════════════════════════════════════════════
//  USERS ROUTER
// ═══════════════════════════════════════════════════════════
const usersRouter = express.Router();
usersRouter.use(protect);

usersRouter.get('/', authorize('Admin'), async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).populate('baseId', 'name code').sort('name');
    res.json({ success: true, count: users.length, data: users });
  } catch (e) { next(e); }
});

usersRouter.post('/', authorize('Admin'),
  auditLog('CREATE_USER', 'User'),
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be 8+ characters'),
    body('role').isIn(['Admin', 'BaseCommander', 'LogisticsOfficer']),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { name, email, password, role, baseId } = req.body;
      const user = await User.create({ name, email, passwordHash: password, role, baseId: role === 'Admin' ? null : baseId });
      res.status(201).json({ success: true, data: user });
    } catch (e) { next(e); }
  }
);

usersRouter.patch('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    const { name, role, baseId, isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, role, baseId, isActive }, { new: true, runValidators: true }).populate('baseId', 'name');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

usersRouter.delete('/:id', authorize('Admin'), async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deactivated.' });
  } catch (e) { next(e); }
});

// ═══════════════════════════════════════════════════════════
//  AUDIT LOGS ROUTER
// ═══════════════════════════════════════════════════════════
const auditLogsRouter = express.Router();
auditLogsRouter.use(protect, authorize('Admin'));

auditLogsRouter.get('/', async (req, res, next) => {
  try {
    const { entity, userId, dateFrom, dateTo, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (entity) filter.entity = entity;
    if (userId) filter.userId = userId;
    Object.assign(filter, buildDateFilter(dateFrom, dateTo, 'createdAt'));

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort('-createdAt')
      .skip((page - 1) * limit).limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);
    res.json({ success: true, total, page: +page, data: logs });
  } catch (e) { next(e); }
});

// ─── EXPORTS ────────────────────────────────────────────────────────────────
module.exports = {
  basesRouter,
  assetsRouter,
  purchasesRouter,
  transfersRouter,
  assignmentsRouter,
  expendituresRouter,
  usersRouter,
  auditLogsRouter,
};
