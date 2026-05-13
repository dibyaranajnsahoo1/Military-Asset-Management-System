const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'], trim: true, maxlength: [100, 'Name max 100 chars'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  passwordHash: {
    type: String, required: true, select: false,
  },
  role: {
    type: String,
    enum: { values: ['Admin', 'BaseCommander', 'LogisticsOfficer'], message: 'Invalid role' },
    required: true,
  },
  baseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Base',
    default: null,
    validate: {
      validator: function (v) {
        // Admin can have null baseId; others must have one
        if (this.role === 'Admin') return true;
        return v != null;
      },
      message: 'Non-admin users must be assigned to a base',
    },
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
