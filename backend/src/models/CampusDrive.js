const mongoose = require('mongoose');

const campusDriveSchema = new mongoose.Schema({
  college:  { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true }, // admin who created

  title:       { type: String, required: true },         // e.g. "Summer Internship 2025 – PICT"
  description: { type: String },
  driveDate:   { type: Date },
  venue:       { type: String },
  mode:        { type: String, enum: ['OFFLINE', 'ONLINE', 'HYBRID'], default: 'OFFLINE' },

  // JD sent to college
  jd: {
    role:                { type: String },
    skills:              [String],
    stipend:             { type: Number },
    duration:            { type: String },
    eligibility:         { type: String },
    minCGPA:             { type: Number, default: 6.0 },
    eligibleDisciplines: [String],  // subset picked from college.disciplines per drive
    description:         { type: String },
    attachmentUrl:       { type: String },
  },

  // Form link students fill
  applicationFormUrl: { type: String },
  applicationFormToken: { type: String, unique: true, sparse: true }, // secure token for the form URL

  status: {
    type: String,
    enum: ['DRAFT', 'JD_SENT', 'APPLICATIONS_OPEN', 'SHORTLISTING', 'SHORTLISTED', 'FURTHER_ROUNDS', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT',
  },

  // Shortlisting config
  shortlistingCriteria: {
    minATSScore: { type: Number, default: 60 },
    minCGPA:     { type: Number, default: 6.0 },
    minClass10:  { type: Number, default: 60 },
    minClass12:  { type: Number, default: 60 },
    slots:       { type: Number, default: 20 },
  },

  // Rounds after shortlisting
  rounds: [{
    roundNo:     { type: Number },
    roundName:   { type: String },  // "Technical Round 1", "HR Round"
    scheduledAt: { type: Date },
    status:      { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    notes:       { type: String },
  }],

  // Aggregate stats
  totalApplicants: { type: Number, default: 0 },
  totalShortlisted:{ type: Number, default: 0 },
  totalSelected:   { type: Number, default: 0 },

}, { timestamps: true });

campusDriveSchema.index({ college: 1, status: 1 });

module.exports = mongoose.model('CampusDrive', campusDriveSchema);
