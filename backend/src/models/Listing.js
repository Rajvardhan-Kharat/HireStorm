const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['INTERNSHIP', 'JOB', 'PART_TIME'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    domain: String,
    skillsRequired: [String],
    location: String,
    isRemote: { type: Boolean, default: false },
    stipend: { amount: Number, currency: { type: String, default: 'INR' }, period: String },
    duration: String,
    openings: { type: Number, default: 1 },
    applicationDeadline: Date,
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED'], default: 'DRAFT' },
    visibility: { type: String, enum: ['PUBLIC', 'PRO_ONLY'], default: 'PUBLIC' },
    isPinned: { type: Boolean, default: false },
    pinnedUntil: Date,
    applicationsCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

listingSchema.index({ status: 1, visibility: 1, applicationDeadline: 1 });
listingSchema.index({ skillsRequired: 1 });
listingSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
