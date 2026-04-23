const mongoose = require('mongoose');

const problemStatementSchema = new mongoose.Schema(
  {
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    domain: String,
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    attachments: [String],
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProblemStatement', problemStatementSchema);
