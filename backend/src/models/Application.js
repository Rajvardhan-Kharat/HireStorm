const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeSnapshot: String,
    coverLetter: String,
    answers: [{ question: String, answer: String }],
    status: {
      type: String,
      enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
      default: 'APPLIED',
    },
    atsScore: { type: Number, default: 0 },
    notes: String,
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ listing: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
