const mongoose = require('mongoose');
const slugify = require('slugify');

const hackathonSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, unique: true },
  description: { type: String, required: true },
  banner:      { type: String, default: '' },

  // Who runs it (always Innobytes / platform admin)
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hostedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  // Entry fee; 0 = free
  entryFee:    { type: Number, default: 0 },

  // College-level filtering (empty = all colleges allowed)
  eligibleColleges: [{ type: String }],

  // Team configuration
  teamConfig: {
    minSize: { type: Number, default: 1 },
    maxSize: { type: Number, default: 4 },
  },

  // Problem statements linked separately
  problemStatements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' }],

  // Key dates
  timeline: {
    registrationOpen:  { type: Date },
    registrationClose: { type: Date },
    hackathonStart:    { type: Date },
    phase1Deadline:    { type: Date },   // +24h from start → ideation submit closes
    phase2Deadline:    { type: Date },   // +48h from start → final build submit closes
    hackathonEnd:      { type: Date },
  },

  // Convenience copies (used by older controllers, kept in sync on save)
  registrationDeadline: { type: Date },
  phase1Deadline:       { type: Date },
  phase2Deadline:       { type: Date },

  status: {
    type: String,
    enum: [
      'DRAFT',
      'REGISTRATION_OPEN',
      'REGISTRATION_CLOSED',
      'ACTIVE',          // hackathon running (phase 1)
      'SHORTLISTING',    // admin reviewing phase 1 submissions
      'HACKING',         // phase 2 build
      'EVALUATION',      // interviews
      'COMPLETED',
    ],
    default: 'DRAFT',
  },

  isStarted:        { type: Boolean, default: false },
  totalRegistrations: { type: Number, default: 0 },

  // Judges (optional)
  judges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  domains: [String],
  tags:    [String],
}, { timestamps: true });

// Auto-generate slug before save
hackathonSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now();
  }
  // Keep flat convenience fields in sync with timeline object
  if (this.timeline) {
    if (this.timeline.registrationClose) this.registrationDeadline = this.timeline.registrationClose;
    if (this.timeline.phase1Deadline)    this.phase1Deadline       = this.timeline.phase1Deadline;
    if (this.timeline.phase2Deadline)    this.phase2Deadline       = this.timeline.phase2Deadline;
  }
  next();
});

hackathonSchema.index({ status: 1 });
hackathonSchema.index({ 'timeline.registrationClose': 1 });
hackathonSchema.index({ 'timeline.phase1Deadline': 1 });

module.exports = mongoose.model('Hackathon', hackathonSchema);
