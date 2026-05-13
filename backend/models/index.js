const mongoose = require('mongoose');

// ─── BASE ──────────────────────────────────────────────────────────────────
const baseSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true, trim: true },
  location: { type: String, required: true, trim: true },
  code:     { type: String, required: true, unique: true, uppercase: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Base = mongoose.model('Base', baseSchema);

// ─── ASSET ─────────────────────────────────────────────────────────────────
const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['Weapon', 'Vehicle', 'Ammunition'] },
  baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true },
  openingQty: { type: Number, required: true, min: 0, default: 0 },
  currentQty:  { type: Number, required: true, min: 0, default: 0 },
  unit:        { type: String, default: 'units' },
  description: { type: String, trim: true },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

assetSchema.index({ baseId: 1, type: 1 });
const Asset = mongoose.model('Asset', assetSchema);

// ─── PURCHASE ──────────────────────────────────────────────────────────────
const purchaseSchema = new mongoose.Schema({
  assetId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  baseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Base',  required: true },
  quantity:     { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  purchaseDate: { type: Date,   required: true },
  supplier:     { type: String, trim: true },
  notes:        { type: String, trim: true },
  addedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

purchaseSchema.index({ baseId: 1, purchaseDate: -1 });
purchaseSchema.index({ assetId: 1 });
const Purchase = mongoose.model('Purchase', purchaseSchema);

// ─── TRANSFER ──────────────────────────────────────────────────────────────
const transferSchema = new mongoose.Schema({
  assetId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  fromBaseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Base',  required: true },
  toBaseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Base',  required: true },
  quantity:     { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
  transferDate: { type: Date,   required: true },
  status:       { type: String, enum: ['Pending','Completed','Cancelled'], default: 'Completed' },
  notes:        { type: String, trim: true },
  initiatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

transferSchema.index({ fromBaseId: 1, transferDate: -1 });
transferSchema.index({ toBaseId:   1, transferDate: -1 });
const Transfer = mongoose.model('Transfer', transferSchema);

// ─── ASSIGNMENT ────────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema({
  assetId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  baseId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Base',  required: true },
  quantity:       { type: Number, required: true, min: 1 },
  assignedTo:     { type: String, required: true, trim: true },
  assignmentDate: { type: Date,   required: true },
  returnDate:     { type: Date },
  status:         { type: String, enum: ['Active','Returned','Expired'], default: 'Active' },
  notes:          { type: String, trim: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

assignmentSchema.index({ baseId: 1, assignmentDate: -1 });
const Assignment = mongoose.model('Assignment', assignmentSchema);

// ─── EXPENDITURE ───────────────────────────────────────────────────────────
const expenditureSchema = new mongoose.Schema({
  assetId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  baseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Base',  required: true },
  quantity:     { type: Number, required: true, min: 1 },
  reason: {
    type: String, required: true,
    enum: ['Training Exercise','Combat Operation','Damaged in Field','Destroyed','Expired','Lost','Maintenance Write-off'],
  },
  dateExpended: { type: Date, required: true },
  notes:        { type: String, trim: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

expenditureSchema.index({ baseId: 1, dateExpended: -1 });
const Expenditure = mongoose.model('Expenditure', expenditureSchema);

// ─── AUDIT LOG ─────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  action:     { type: String, required: true }, // e.g. 'CREATE_PURCHASE'
  entity:     { type: String, required: true }, // e.g. 'Purchase'
  entityId:   { type: mongoose.Schema.Types.ObjectId },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:   { type: String, required: true },
  userRole:   { type: String, required: true },
  baseId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Base' },
  details:    { type: mongoose.Schema.Types.Mixed },  // payload snapshot
  ipAddress:  { type: String },
  userAgent:  { type: String },
}, { timestamps: true });

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { Base, Asset, Purchase, Transfer, Assignment, Expenditure, AuditLog };
