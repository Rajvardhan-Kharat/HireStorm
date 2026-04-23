const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    scheduledAt: Date,
    completedAt: Date,
    mentorOnDuty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    progressUpdate: String,
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'MISSED'], default: 'PENDING' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CheckIn', checkInSchema);
