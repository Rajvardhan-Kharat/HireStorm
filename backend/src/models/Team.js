const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String },
  role:  { type: String, enum: ['Leader', 'Member'], default: 'Member' },
}, { _id: false });

const inviteSchema = new mongoose.Schema({
  email:  { type: String, required: true },
  token:  { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'EXPIRED'], default: 'PENDING' },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  hackathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: true,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name:    { type: String, required: true, trim: true },
  college: { type: String, default: '' },

  members: [memberSchema],
  invites: [inviteSchema],

  // Which problem statement this team locked
  problemStatement: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' },
  isProblemLocked:  { type: Boolean, default: false },

  // Phase 1 — Ideation submission (leader submits on behalf of team)
  phase1Submission: {
    pptUrl:           { type: String },
    videoUrl:         { type: String },
    proposedSolution: { type: String },
    submittedAt:      { type: Date },
  },

  // Phase 2 — Final build submission
  phase2Submission: {
    repoUrl:     { type: String },
    pptUrl:      { type: String },
    videoUrl:    { type: String },
    submittedAt: { type: Date },
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'WAIVED'],
    default: 'PENDING',
  },
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },

  stage: {
    type: String,
    enum: [
      'REGISTERED',
      'IDEATION_SUBMITTED',
      'SHORTLISTED',      // survived phase 1 review
      'IN_HACKATHON',     // working on phase 2
      'EVALUATED',        // submitted phase 2
      'WINNER',
      'REJECTED',
    ],
    default: 'REGISTERED',
  },
}, { timestamps: true });

teamSchema.index({ hackathon: 1, stage: 1 });
teamSchema.index({ hackathon: 1, leader: 1 }, { unique: true });

module.exports = mongoose.model('Team', teamSchema);
