require('dotenv').config();
const crypto = require('crypto');
const College = require('../models/College');
const CampusDrive = require('../models/CampusDrive');
const DriveApplication = require('../models/DriveApplication');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Helpers ────────────────────────────────────────────────────────────────

const calcOverallScore = (app) => {
  const ats  = (app.atsScore   || 0) * 0.40;
  const cgpa = Math.min((app.student.cgpa || 0) / 10, 1) * 100 * 0.30;
  const cl10 = (app.student.class10 || 0) * 0.15;
  const cl12 = (app.student.class12 || 0) * 0.15;
  return Math.round(ats + cgpa + cl10 + cl12);
};

// ─── ADMIN: Manage colleges ──────────────────────────────────────────────────

// GET /api/v1/college/admin/list
const adminListColleges = async (req, res) => {
  try {
    const colleges = await College.find().select('-password -refreshToken').sort({ name: 1 });
    res.json({ success: true, colleges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/college/admin/create
const adminCreateCollege = async (req, res) => {
  try {
    const { name, slug, code, university, email, password, city, address, phone, website, tpo } = req.body;
    const college = await College.create({ name, slug, code, university, email, password, city, address, phone, website, tpo });
    res.status(201).json({ success: true, college: college.toPublicProfile() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'College with this email/slug/code already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/college/admin/:id
const adminUpdateCollege = async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password -refreshToken');
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, college });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/v1/college/admin/:id
const adminDeleteCollege = async (req, res) => {
  try {
    await College.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'College deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: Campus Drives ────────────────────────────────────────────────────

// POST /api/v1/college/admin/drives  — create a drive + send JD to college
const adminCreateDrive = async (req, res) => {
  try {
    const { collegeId, title, description, driveDate, venue, mode, jd, shortlistingCriteria } = req.body;

    const college = await College.findById(collegeId);
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });

    // Generate a unique form token
    const applicationFormToken = crypto.randomBytes(24).toString('hex');
    const applicationFormUrl = `${process.env.CLIENT_URL}/apply/${applicationFormToken}`;

    const drive = await CampusDrive.create({
      college: collegeId,
      createdBy: req.user._id,
      title, description, driveDate, venue, mode,
      jd, shortlistingCriteria,
      applicationFormToken,
      applicationFormUrl,
      status: 'JD_SENT',
    });

    // Increment college drive count
    await College.findByIdAndUpdate(collegeId, { $inc: { totalDrives: 1 } });

    res.status(201).json({ success: true, drive, applicationFormUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/admin/drives — all drives (optionally filter by college)
const adminListDrives = async (req, res) => {
  try {
    const filter = {};
    if (req.query.collegeId) filter.college = req.query.collegeId;
    if (req.query.status) filter.status = req.query.status;

    const drives = await CampusDrive.find(filter)
      .populate('college', 'name code city slug')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/college/admin/drives/:id — update drive / open applications
const adminUpdateDrive = async (req, res) => {
  try {
    const drive = await CampusDrive.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('college', 'name code city slug');
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.json({ success: true, drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/admin/drives/:id/applications — list all applications for a drive
const adminListApplications = async (req, res) => {
  try {
    const { status, sortBy = 'overallScore', order = 'desc' } = req.query;
    const filter = { drive: req.params.id };
    if (status) filter.status = status;

    const apps = await DriveApplication.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 });

    res.json({ success: true, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/college/admin/drives/:id/shortlist — bulk shortlist by criteria
const adminShortlistStudents = async (req, res) => {
  try {
    const drive = await CampusDrive.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    const { criteria } = req.body; // optional override
    const sc = criteria || drive.shortlistingCriteria;

    // Find eligible applicants
    const candidates = await DriveApplication.find({
      drive: drive._id,
      status: { $in: ['APPLIED', 'UNDER_REVIEW'] },
      'student.cgpa':    { $gte: sc.minCGPA },
      'student.class10': { $gte: sc.minClass10 },
      'student.class12': { $gte: sc.minClass12 },
      atsScore:          { $gte: sc.minATSScore },
    }).sort({ overallScore: -1 }).limit(sc.slots || 9999);

    const ids = candidates.map(c => c._id);
    await DriveApplication.updateMany({ _id: { $in: ids } }, { status: 'SHORTLISTED', shortlistedAt: new Date() });

    // Update drive stats
    await CampusDrive.findByIdAndUpdate(drive._id, {
      totalShortlisted: ids.length,
      status: 'SHORTLISTED',
    });

    res.json({ success: true, shortlisted: ids.length, message: `${ids.length} students shortlisted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/college/admin/applications/:appId — update single application status / notes
const adminUpdateApplication = async (req, res) => {
  try {
    const app = await DriveApplication.findByIdAndUpdate(req.params.appId, req.body, { new: true });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/college/admin/applications/:appId/select — convert selected to intern
const adminSelectStudentAsIntern = async (req, res) => {
  try {
    const app = await DriveApplication.findById(req.params.appId).populate('drive');
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    // Try to link to platform user
    let platformUser = app.platformUser;
    if (!platformUser) {
      platformUser = await User.findOne({ email: app.student.email });
      if (platformUser) {
        app.platformUser = platformUser._id;
      }
    }

    if (!platformUser) {
      return res.status(400).json({
        success: false,
        message: 'Student has no platform account. Ask them to register first.',
        studentEmail: app.student.email,
      });
    }

    // Create internship
    const { startDate, endDate, stipend, mentor } = req.body;
    const internship = await Internship.create({
      intern: platformUser._id,
      mentor: mentor || null,
      campusDrive: app.drive._id,
      college: app.college,
      source: 'CAMPUS_DRIVE',
      startDate,
      endDate,
      stipend: stipend || { amount: 10000, currency: 'INR' },
      status: 'OFFER_SENT',
    });

    // Update application
    app.status = 'OFFER_SENT';
    app.selectedAt = new Date();
    app.internship = internship._id;
    await app.save();

    // Update user's activeInternship
    await User.findByIdAndUpdate(platformUser._id, {
      activeInternship: internship._id,
      role: 'INTERN',
    });

    // Update drive stats
    await CampusDrive.findByIdAndUpdate(app.drive._id, { $inc: { totalSelected: 1 } });
    await College.findByIdAndUpdate(app.college, { $inc: { totalSelected: 1 } });

    res.json({ success: true, internship, message: 'Internship offer sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUBLIC: Apply Form ───────────────────────────────────────────────────────

// GET /api/v1/college/apply/:token — get drive info for the form page
const getDriveByToken = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ applicationFormToken: req.params.token })
      .populate('college', 'name code city university logo tpo');
    if (!drive || drive.status === 'CANCELLED') {
      return res.status(404).json({ success: false, message: 'Drive not found or cancelled' });
    }
    if (!['APPLICATIONS_OPEN', 'JD_SENT'].includes(drive.status)) {
      return res.status(400).json({ success: false, message: 'Applications are currently closed' });
    }
    res.json({ success: true, drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/college/apply/:token — submit application
const submitDriveApplication = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ applicationFormToken: req.params.token });
    if (!drive || !['APPLICATIONS_OPEN', 'JD_SENT'].includes(drive.status)) {
      return res.status(400).json({ success: false, message: 'Applications are closed' });
    }

    const { student } = req.body;

    // Check for duplicate
    const existing = await DriveApplication.findOne({ drive: drive._id, 'student.email': student.email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied to this drive' });
    }

    // Run ATS scoring via Gemini AI
    let atsScore = null;
    let atsAnalysis = null;
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
You are an ATS (Applicant Tracking System) evaluator for an internship role.

Job Role: ${drive.jd?.role || 'Software Developer Intern'}
Required Skills: ${(drive.jd?.skills || []).join(', ') || 'Programming, Problem Solving'}
Minimum CGPA: ${drive.jd?.minCGPA || 6.0}

Candidate Profile:
- Name: ${student.name}
- Branch: ${student.branch}
- CGPA: ${student.cgpa}
- Skills: ${(student.skills || []).join(', ')}
- Projects: ${student.projects || 'Not mentioned'}
- Resume Text (if available): ${student.resumeText || 'Not provided'}

Score this candidate on a scale of 0-100 for ATS fitment.
Return ONLY a JSON object: {"score": <number 0-100>, "analysis": "<2-3 sentence feedback>"}
`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        atsScore = Math.min(100, Math.max(0, parsed.score));
        atsAnalysis = parsed.analysis;
      }
    } catch (_) {
      atsScore = 50; // fallback
    }

    const app = await DriveApplication.create({
      drive: drive._id,
      college: drive.college,
      student: { ...student, email: student.email.toLowerCase() },
      atsScore,
      atsAnalysis,
    });

    // Compute overallScore and save
    app.overallScore = calcOverallScore(app);
    await app.save();

    // Update drive applicant count
    await CampusDrive.findByIdAndUpdate(drive._id, { $inc: { totalApplicants: 1 }, status: 'APPLICATIONS_OPEN' });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: app._id,
      atsScore,
      atsAnalysis,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied to this drive' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── COLLEGE PORTAL: Auth & Drive Views ──────────────────────────────────────

// GET /api/v1/college/portal/profile
const collegeGetProfile = async (req, res) => {
  try {
    res.json({ success: true, college: req.college.toPublicProfile() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/portal/drives — drives for this college
const collegeGetDrives = async (req, res) => {
  try {
    const drives = await CampusDrive.find({ college: req.college._id }).sort({ createdAt: -1 });
    res.json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/portal/drives/:id/applications — applications visible to college
const collegeGetDriveApplications = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ _id: req.params.id, college: req.college._id });
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    const apps = await DriveApplication.find({ drive: drive._id })
      .sort({ overallScore: -1 });

    res.json({ success: true, applications: apps, drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/portal/drives/:id/shortlisted — shortlisted students for college
const collegeGetShortlisted = async (req, res) => {
  try {
    const drive = await CampusDrive.findOne({ _id: req.params.id, college: req.college._id });
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    const apps = await DriveApplication.find({ drive: drive._id, status: { $in: ['SHORTLISTED', 'ROUND_2', 'ROUND_3', 'SELECTED', 'OFFER_SENT'] } })
      .sort({ overallScore: -1 });

    res.json({ success: true, shortlisted: apps, drive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/college/public/:slug — public college info
const getCollegePublicInfo = async (req, res) => {
  try {
    const college = await College.findOne({ slug: req.params.slug, isActive: true }).select('-password -refreshToken -email');
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.json({ success: true, college });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  // Admin
  adminListColleges, adminCreateCollege, adminUpdateCollege, adminDeleteCollege,
  adminCreateDrive, adminListDrives, adminUpdateDrive,
  adminListApplications, adminShortlistStudents,
  adminUpdateApplication, adminSelectStudentAsIntern,
  // Public form
  getDriveByToken, submitDriveApplication,
  // College portal
  collegeGetProfile, collegeGetDrives, collegeGetDriveApplications, collegeGetShortlisted,
  // Public
  getCollegePublicInfo,
};
