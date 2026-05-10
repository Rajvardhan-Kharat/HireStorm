const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const collegeSchema = new mongoose.Schema({
  // Identity
  name:       { type: String, required: true },
  slug:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  code:       { type: String, required: true, unique: true, uppercase: true },

  // Classification
  type: {
    type: String,
    enum: ['ENGINEERING', 'MANAGEMENT', 'ARTS_SCIENCE', 'MEDICAL', 'LAW', 'RESEARCH', 'DESIGN', 'SPECIALIZED', 'UNIVERSITY'],
    required: true,
    default: 'ENGINEERING',
  },
  university:   { type: String, required: true },   // e.g. "SPPU", "Mumbai University", "Delhi University", "Anna University"
  disciplines:  [{ type: String }],                 // All programs/branches offered — drives pick a subset

  // Location
  address:   { type: String },
  city:      { type: String, required: true },
  state:     { type: String, default: 'Maharashtra' },
  phone:     { type: String },
  website:   { type: String },
  logo:      { type: String },

  // Auth
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  // TPO Contact
  tpo: {
    name:  { type: String },
    email: { type: String },
    phone: { type: String },
  },

  // Access control
  isActive:     { type: Boolean, default: true },
  refreshToken: { type: String },

  // Stats (denormalized for quick display)
  totalDrives:   { type: Number, default: 0 },
  totalSelected: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password
collegeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

collegeSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

collegeSchema.methods.toPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

collegeSchema.index({ university: 1 });
collegeSchema.index({ city: 1 });
collegeSchema.index({ type: 1 });

module.exports = mongoose.model('College', collegeSchema);
