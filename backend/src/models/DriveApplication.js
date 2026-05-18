const mongoose = require('mongoose');

// Submitted by students via public form link
const driveApplicationSchema = new mongoose.Schema({
  drive:    { type: mongoose.Schema.Types.ObjectId, ref: 'CampusDrive', required: true },
  college:  { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },

  // Student personal info (collected in form, may link to User later)
  student: {
    name:       { type: String, required: true },
    email:      { type: String, required: true, lowercase: true },
    phone:      { type: String },
    rollNo:     { type: String },
    branch:     { type: String },
    year:       { type: String }, // "3rd Year", "Final Year"
    cgpa:       { type: Number },
    class10:    { type: Number },  // % marks
    class12:    { type: Number },  // % marks
    linkedIn:   { type: String },
    portfolio:  { type: String },
    resumeUrl:  { type: String },  // Cloudinary URL
    skills:     [String],
    projects:   { type: String },  // brief text
  },

  // ATS Score (computed by AI)
  atsScore:       { type: Number, default: null },
  atsAnalysis:    { type: String },  // AI feedback
  overallScore:   { type: Number, default: null }, // composite score

  // Platform user link (if student registered on platform)
  platformUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Status in the drive pipeline
  status: {
    type: String,
    enum: ['APPLIED','UNDER_REVIEW','SHORTLISTED','AI_TEST_SENT','AI_TEST_COMPLETED','AI_TEST_PASSED','AI_TEST_FAILED','INTERVIEW_SCHEDULED','INTERVIEW_DONE','REJECTED','SELECTED','OFFER_SENT'],
    default: 'APPLIED',
  },

  shortlistedAt: { type: Date },
  selectedAt:    { type: Date },
  rejectedAt:    { type: Date },
  rejectionReason: { type: String },

  // ── AI Skills Test ────────────────────────────────────────────────────────
  aiTest: {
    token:        { type: String },          // unique token for the test link
    sentAt:       { type: Date },
    submittedAt:  { type: Date },
    score:        { type: Number },          // 0–100
    passed:       { type: Boolean },
    questions:    { type: mongoose.Schema.Types.Mixed }, // [{q, options, correct}]
    answers:      { type: mongoose.Schema.Types.Mixed }, // {qIndex: chosenOption}
    feedback:     { type: String },          // AI-generated feedback on answers
  },

  // ── Interview ─────────────────────────────────────────────────────────────
  interview: {
    scheduled:    { type: Boolean, default: false },
    meetLink:     { type: String },
    scheduledAt:  { type: Date },
    notes:        { type: String },
    outcome:      { type: String, enum: ['PENDING','PASSED','FAILED'], default: 'PENDING' },
  },

  // ── Offer Letter ──────────────────────────────────────────────────────────
  offerLetter: {
    sentAt:       { type: Date },
    acceptToken:  { type: String },
    rejectToken:  { type: String },
    accepted:     { type: Boolean },
    respondedAt:  { type: Date },
  },

  // Internship created from this application
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', default: null },

  // Admin notes
  adminNotes: { type: String },

  // Unique per drive per student email
}, { timestamps: true });

driveApplicationSchema.index({ drive: 1, 'student.email': 1 }, { unique: true });
driveApplicationSchema.index({ drive: 1, status: 1 });
driveApplicationSchema.index({ college: 1 });
driveApplicationSchema.index({ atsScore: -1 });

module.exports = mongoose.model('DriveApplication', driveApplicationSchema);
