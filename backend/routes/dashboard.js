const express = require('express');
const { protect, scopeToBase } = require('../middleware/auth');
const { Asset, Purchase, Transfer, Assignment, Expenditure } = require('../models');

const router = express.Router();
router.use(protect, scopeToBase);

// ─── GET /api/dashboard/metrics ────────────────────────────────────────────
router.get('/metrics', async (req, res, next) => {
  try {
    const { dateFrom, dateTo, assetType } = req.query;
    const baseScope = req.baseScope;

    // Build date filter
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo)   dateFilter.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));

    // Asset filter
    const assetQuery = {};
    if (baseScope)  assetQuery.baseId = baseScope;
    if (assetType)  assetQuery.type   = assetType;
    const relevantAssets = await Asset.find(assetQuery).lean();
    const assetIds  = relevantAssets.map(a => a._id);
    const baseIds   = [...new Set(relevantAssets.map(a => String(a.baseId)))];

    // Opening balance
    const openingBalance = relevantAssets.reduce((s, a) => s + (a.openingQty || 0), 0);

    // Purchases
    const purchaseQuery = { assetId: { $in: assetIds }, baseId: { $in: baseIds } };
    if (Object.keys(dateFilter).length) purchaseQuery.purchaseDate = dateFilter;
    const purchases = await Purchase.find(purchaseQuery).populate('assetId', 'name type').lean();
    const totalPurchases = purchases.reduce((s, p) => s + p.quantity, 0);

    // Transfers In
    const tiQuery = { assetId: { $in: assetIds }, toBaseId: { $in: baseIds } };
    if (Object.keys(dateFilter).length) tiQuery.transferDate = dateFilter;
    const transfersIn = await Transfer.find(tiQuery).populate('assetId', 'name type').lean();
    const totalTransfersIn = transfersIn.reduce((s, t) => s + t.quantity, 0);

    // Transfers Out
    const toQuery = { assetId: { $in: assetIds }, fromBaseId: { $in: baseIds } };
    if (Object.keys(dateFilter).length) toQuery.transferDate = dateFilter;
    const transfersOut = await Transfer.find(toQuery).populate('assetId', 'name type').lean();
    const totalTransfersOut = transfersOut.reduce((s, t) => s + t.quantity, 0);

    // Net Movement
    const netMovement = totalPurchases + totalTransfersIn - totalTransfersOut;

    // Assignments
    const assignQuery = { assetId: { $in: assetIds }, baseId: { $in: baseIds } };
    if (Object.keys(dateFilter).length) assignQuery.assignmentDate = dateFilter;
    const assignments = await Assignment.find(assignQuery).lean();
    const totalAssigned = assignments.reduce((s, a) => s + a.quantity, 0);

    // Expenditures
    const expQuery = { assetId: { $in: assetIds }, baseId: { $in: baseIds } };
    if (Object.keys(dateFilter).length) expQuery.dateExpended = dateFilter;
    const expenditures = await Expenditure.find(expQuery).lean();
    const totalExpended = expenditures.reduce((s, e) => s + e.quantity, 0);

    // Closing Balance
    const closingBalance = openingBalance + netMovement - totalAssigned - totalExpended;

    res.json({
      success: true,
      data: {
        openingBalance,
        closingBalance,
        netMovement,
        totalPurchases,
        totalTransfersIn,
        totalTransfersOut,
        totalAssigned,
        totalExpended,
        // Detailed lists for the Net Movement popup (bonus)
        purchasesList:    purchases,
        transfersInList:  transfersIn,
        transfersOutList: transfersOut,
      },
    });
  } catch (err) { next(err); }
});

// ─── GET /api/dashboard/chart ──────────────────────────────────────────────
// Returns last N months of aggregated data for the bar chart
router.get('/chart', async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const baseScope = req.baseScope;
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const baseQuery = baseScope ? { baseId: baseScope } : {};
      const assets = await Asset.find(baseQuery).lean();
      const aIds   = assets.map(a => a._id);

      const [p, ti, to, as_, ex] = await Promise.all([
        Purchase.aggregate([{ $match: { assetId: { $in: aIds }, purchaseDate: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
        Transfer.aggregate([{ $match: { assetId: { $in: aIds }, toBaseId: baseScope ? { $in: [baseScope] } : { $exists: true }, transferDate: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
        Transfer.aggregate([{ $match: { assetId: { $in: aIds }, fromBaseId: baseScope ? { $in: [baseScope] } : { $exists: true }, transferDate: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
        Assignment.aggregate([{ $match: { assetId: { $in: aIds }, assignmentDate: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
        Expenditure.aggregate([{ $match: { assetId: { $in: aIds }, dateExpended: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$quantity' } } }]),
      ]);

      data.push({
        month:       start.toLocaleString('default', { month: 'short' }),
        year:        start.getFullYear(),
        Purchases:   p[0]?.total  || 0,
        TransferIn:  ti[0]?.total || 0,
        TransferOut: to[0]?.total || 0,
        Assigned:    as_[0]?.total || 0,
        Expended:    ex[0]?.total  || 0,
      });
    }

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

module.exports = router;
