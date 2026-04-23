const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    stage: { type: String, enum: ['IDEATION', 'FINAL'], required: true },
    // Stage 1 — Ideation
    pptUrl: String,
    figmaUrl: String,
    prototypeUrl: String,
    ideationNotes: String,
    // Stage 2 — Final
    repoUrl: String,
    deployedUrl: String,
    demoVideoUrl: String,
    finalPresentation: String,
    // Scoring
    scores: [
      {
        judge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rubric: {
          innovation: { type: Number, min: 0, max: 10, default: 0 },
          technicalDepth: { type: Number, min: 0, max: 10, default: 0 },
          feasibility: { type: Number, min: 0, max: 10, default: 0 },
          presentation: { type: Number, min: 0, max: 10, default: 0 },
          impact: { type: Number, min: 0, max: 10, default: 0 },
        },
        totalScore: Number,
        feedback: String,
        scoredAt: Date,
      },
    ],
    averageScore: { type: Number, default: 0 },
    rank: Number,
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);
