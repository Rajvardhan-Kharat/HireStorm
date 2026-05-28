const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const {
  sendOffer, acceptOffer, getMyInternship,
  getMentoringInternships, submitMonthlyReview,
  shareLinkedIn, verifyCertificate, generateDevCertificate,
  getInternshipLogs, getAllInternships, scoreDailyLog,
  assignMentor, attemptExam,
} = require('../controllers/ilm.controller');

const { submitDailyLog } = require('../controllers/dailyLog.controller');
const { generateExam, submitQuiz: submitExam } = require('../controllers/finalExam.controller');

const ADMIN = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];

// ── Intern: Accept Offer (MUST be before /offer/:userId to avoid wildcard match) ──
router.post('/offer/accept',            protect, allowRoles('INTERN', 'STUDENT', 'PRO_STUDENT'), acceptOffer);

// ── Admin: Send Offer & Manage ────────────────────────────────────────────────
router.post('/offer/:userId',           protect, allowRoles(...ADMIN), sendOffer);

// ── Intern: My Internship ─────────────────────────────────────────────────────
// Allow STUDENT + PRO_STUDENT so Dashboard can check for pending offers without 403
router.get('/my',                       protect, allowRoles('INTERN', 'STUDENT', 'PRO_STUDENT'), getMyInternship);
router.post('/my/daily-log',            protect, allowRoles('INTERN'), submitDailyLog);

// Daily log route used by DailyLog.jsx (/ilm/daily-log POST)
router.post('/daily-log',               protect, allowRoles('INTERN'), submitDailyLog);

// ── Final Exam & Certificate ──────────────────────────────────────────────────
router.get('/exam/generate',            protect, allowRoles('INTERN'), generateExam);
router.post('/exam/submit',             protect, allowRoles('INTERN'), submitExam);
router.post('/exam/attempt',            protect, allowRoles('INTERN'), attemptExam);

router.post('/certificate/share-linkedin', protect, allowRoles('INTERN'), shareLinkedIn);
// DEV OVERRIDE — restrict to INTERN only in production to prevent fake certificates
router.post('/certificate/dev-generate', protect, allowRoles('INTERN'), generateDevCertificate);
router.get('/verify/:certId', verifyCertificate); // public

module.exports = router;
