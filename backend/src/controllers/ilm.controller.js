const Internship = require('../models/Internship');
const User = require('../models/User');
const { generateWBS } = require('../services/wbsGenerator');
const { generateCertificate } = require('../services/certificateService');
const { shareCertificateOnLinkedIn } = require('../services/linkedinService');
const { sendOfferLetter, sendCertificateEmail } = require('../services/emailService');
const { notify } = require('../services/notificationService');
const PDFDocument = require('pdfkit');
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

// POST /api/v1/ilm/offer/:userId — admin sends offer
exports.sendOffer = async (req, res) => {
  try {
    const { mentorId, hackathonId, companyId, startDate, stipendAmount, domain } = req.body;
    const intern = await User.findById(req.params.userId);
    if (!intern) return res.status(404).json({ success: false, message: 'User not found' });

    const start = new Date(startDate || Date.now());
    const end   = new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Generate WBS — stored under 'wbs' field (not wbsTasks)
    const wbs = generateWBS(start, intern.profile?.skills || []);

    // Generate offer letter PDF
    let offerLetterUrl = null;
    try {
      const pdfBuffer = await new Promise((resolve, reject) => {
        const doc    = new PDFDocument({ margin: 50 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end',  () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.fontSize(20).font('Helvetica-Bold').text('INTERNSHIP OFFER LETTER', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Dear ${intern.profile.firstName} ${intern.profile.lastName},`);
        doc.moveDown();
        doc.text(`We are pleased to offer you a 90-Day Internship at HireStorm starting ${start.toDateString()}.`);
        doc.text(`Stipend: ₹${stipendAmount || 10000}/month | End Date: ${end.toDateString()}`);
        doc.moveDown(2);
        doc.text('Please accept this offer within 48 hours by visiting your dashboard.');
        doc.moveDown(3);
        doc.text('HireStorm Platform Authority', { align: 'right' });
        doc.end();
      });

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'hirestorm/offer-letters', resource_type: 'raw', format: 'pdf' },
          (err, result) => { if (err) reject(err); else resolve(result); }
        );
        Readable.from(pdfBuffer).pipe(stream);
      });
      offerLetterUrl = uploadResult.secure_url;
    } catch (pdfErr) {
      console.error('[sendOffer] PDF error:', pdfErr.message);
    }

    const internship = await Internship.create({
      intern:    req.params.userId,
      mentor:    mentorId || null,
      hackathon: hackathonId || null,
      company:   companyId  || null,
      startDate: start,
      endDate:   end,
      status:    'OFFER_SENT',
      offerStatus: 'PENDING',
      stipend:   { amount: stipendAmount || 10000 },
      offerLetterUrl,
      wbs,          // ← correct field name
    });

    if (offerLetterUrl) {
      try { await sendOfferLetter(intern.email, intern.profile.firstName, offerLetterUrl); } catch {}
    }
    await notify({
      recipientId: intern._id,
      type:    'OFFER_LETTER',
      title:   'Internship Offer Received',
      message: 'Please review and accept your internship offer on the platform.',
      link:    '/dashboard',
      channel: ['IN_APP'],
    });

    res.status(201).json({ success: true, data: internship });
  } catch (err) {
    console.error('[sendOffer]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ilm/offer/accept
exports.acceptOffer = async (req, res) => {
  try {
    const internship = await Internship.findOne({ intern: req.user._id, offerStatus: 'PENDING' });
    if (!internship) return res.status(404).json({ success: false, message: 'No pending offer found' });
    internship.offerStatus     = 'ACCEPTED';
    internship.offerAcceptedAt = new Date();
    internship.status          = 'ACTIVE';
    internship.startDate       = internship.startDate || new Date();
    internship.endDate         = internship.endDate   || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await internship.save();
    await User.findByIdAndUpdate(req.user._id, { role: 'INTERN', activeInternship: internship._id });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ilm/my
exports.getMyInternship = async (req, res) => {
  try {
    const internship = await Internship.findOne({ intern: req.user._id })
      .populate('mentor',   'profile email')
      .populate('company',  'name logo')
      .populate('hackathon','title slug');
    if (!internship) return res.status(404).json({ success: false, message: 'No internship found' });
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ilm/all — admin sees all interns
exports.getAllInternships = async (req, res) => {
  try {
    const internships = await Internship.find()
      .populate('intern',   'profile email')
      .populate('company',  'name')
      .populate('mentor',   'profile email')
      .populate('hackathon','title slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/v1/ilm/:id/assign-mentor — admin assigns a mentor
exports.assignMentor = async (req, res) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) return res.status(400).json({ success: false, message: 'mentorId is required' });

    const mentor = await User.findById(mentorId);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { mentor: mentorId },
      { new: true }
    ).populate('intern', 'profile email').populate('mentor', 'profile email');

    if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

    await notify({
      recipientId: internship.intern._id,
      type:    'GENERAL',
      title:   'Mentor Assigned',
      message: `${mentor.profile?.firstName} ${mentor.profile?.lastName} has been assigned as your mentor.`,
      link:    '/ilm',
      channel: ['IN_APP'],
    });

    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/ilm/:ilmId/logs/:logId/score
exports.scoreDailyLog = async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined || score < 0 || score > 10) {
      return res.status(400).json({ success: false, message: 'Score must be 0–10' });
    }
    const internship = await Internship.findById(req.params.ilmId);
    if (!internship) return res.status(404).json({ success: false, message: 'Not found' });

    const log = internship.dailyLogs.id(req.params.logId);
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });

    log.mentorScore = Number(score);
    log.status      = 'REVIEWED';
    await internship.save();

    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ilm/mentoring — mentor sees their interns
exports.getMentoringInternships = async (req, res) => {
  try {
    const internships = await Internship.find({ mentor: req.user._id })
      .populate('intern', 'profile email')
      .populate('company', 'name');
    res.json({ success: true, data: internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/ilm/mentoring/:ilmId/monthly-review
// Allowed: MENTOR (must own the intern) or PLATFORM_ADMIN / SUPER_ADMIN (bypass)
exports.submitMonthlyReview = async (req, res) => {
  try {
    const { month, taskCompletion, codeQuality, communication, initiative, feedback } = req.body;
    const internship = await Internship.findById(req.params.ilmId);
    if (!internship) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = ['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    if (!isAdmin && internship.mentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your intern' });
    }

    const tC = Number(taskCompletion) || 0;
    const cQ = Number(codeQuality)    || 0;
    const cm = Number(communication)  || 0;
    const in_ = Number(initiative)    || 0;
    const totalScore = tC + cQ + cm + in_;

    const reviewObj = {
      month,
      reviewDate: new Date(),
      rubric: { taskCompletion: tC, codeQuality: cQ, communication: cm, initiative: in_ },
      totalScore,
      feedback: feedback || '',
      status: 'COMPLETED',
      reviewedBy: req.user._id,
    };

    const reviewIdx = internship.monthlyReviews.findIndex(r => r.month === month);
    if (reviewIdx >= 0) internship.monthlyReviews[reviewIdx] = reviewObj;
    else internship.monthlyReviews.push(reviewObj);

    // Recalculate CA score
    const completed = internship.monthlyReviews.filter(r => r.status === 'COMPLETED');
    if (completed.length > 0) {
      internship.continuousAssessmentScore =
        completed.reduce((sum, r) => sum + r.totalScore, 0) / completed.length;
    }

    // Unlock exam after month 3
    if (month === 3) {
      if (internship.continuousAssessmentScore >= internship.assessmentThreshold) {
        internship.isExamUnlocked = true;
        await notify({
          recipientId: internship.intern,
          type:    'CERTIFICATE_READY',
          title:   '🎓 Final Exam Unlocked!',
          message: 'You have passed your continuous assessment. The final exam is now available.',
          link:    '/ilm/exam',
          channel: ['IN_APP'],
        });
      } else {
        internship.status = 'FAILED_ASSESSMENT';
      }
    }

    await internship.save();
    res.json({ success: true, data: internship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ilm/internship-logs (unused, kept for compat)
exports.getInternshipLogs = async (req, res) => {
  try {
    const internship = await Internship.findOne({ intern: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: internship.dailyLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ilm/certificate/share-linkedin
exports.shareLinkedIn = async (req, res) => {
  try {
    const internship = await Internship.findOne({ intern: req.user._id });
    if (!internship?.certificate?.isGenerated) {
      return res.status(400).json({ success: false, message: 'No certificate available' });
    }
    const result = await shareCertificateOnLinkedIn(internship._id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ilm/certificate/dev-generate — FOR TESTING PURPOSES ONLY
exports.generateDevCertificate = async (req, res) => {
  try {
    const internship = await Internship.findOne({ intern: req.user._id });
    if (!internship) return res.status(404).json({ success: false, message: 'No internship found' });
    
    // Force pass the exam
    internship.exam = { attemptedAt: new Date(), score: 100, isPassed: true };
    internship.isExamUnlocked = true;
    await internship.save();
    
    const { certificateId, certificateUrl } = await generateCertificate(internship._id);
    
    // Notify
    const intern = await User.findById(internship.intern);
    await sendCertificateEmail(intern.email, `${intern.profile?.firstName} ${intern.profile?.lastName}`, certificateUrl).catch(() => {});
    await notify({ recipientId: internship.intern, type: 'CERTIFICATE_READY', title: '🏆 Certificate Ready!', message: 'Congratulations! Your certificate has been generated.', link: '/ilm/certificate', channel: ['IN_APP'] });
    
    res.json({ success: true, data: { certificateId, certificateUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/ilm/verify/:certId — public certificate verification
exports.verifyCertificate = async (req, res) => {
  try {
    const internship = await Internship.findOne({ 'certificate.certificateId': req.params.certId })
      .populate('intern',  'profile.firstName profile.lastName')
      .populate('company', 'name');
    if (!internship) return res.status(404).json({ success: false, message: 'Certificate not found' });
    res.json({
      success: true,
      data: {
        certificateId: req.params.certId,
        intern:        internship.intern?.profile,
        company:       internship.company?.name || 'HireStorm',
        issuedAt:      internship.certificate.issuedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/ilm/exam/attempt (legacy)
exports.attemptExam = async (req, res) => {
  try {
    const { score } = req.body;
    const internship = await Internship.findOne({ intern: req.user._id, isExamUnlocked: true });
    if (!internship) return res.status(403).json({ success: false, message: 'Exam not unlocked' });
    if (internship.exam?.attemptedAt) return res.status(400).json({ success: false, message: 'Already attempted' });

    const isPassed = score >= (internship.exam?.passMark || 70);
    internship.exam = { attemptedAt: new Date(), score, isPassed };
    await internship.save();

    if (isPassed) {
      try {
        const { certificateId, certificateUrl } = await generateCertificate(internship._id);
        const intern = await User.findById(internship.intern);
        await sendCertificateEmail(intern.email, `${intern.profile?.firstName} ${intern.profile?.lastName}`, certificateUrl);
        await notify({ recipientId: internship.intern, type: 'CERTIFICATE_READY', title: '🏆 Certificate Ready!', message: 'Congratulations! Your certificate has been generated.', link: '/ilm/certificate', channel: ['IN_APP'] });
      } catch (certErr) {
        console.error('[attemptExam] Certificate gen error:', certErr.message);
      }
    }
    res.json({ success: true, data: { isPassed, score } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
