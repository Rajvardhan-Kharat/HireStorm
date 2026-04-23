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

// ── Admin: Send Offer & Manage ────────────────────────────────────────────────
router.post('/offer/:userId',           protect, allowRoles(...ADMIN), sendOffer);
router.get('/all',                      protect, allowRoles(...ADMIN), getAllInternships);
router.patch('/:id/assign-mentor',      protect, allowRoles(...ADMIN), assignMentor);

// ── Mentor / Admin: Review ────────────────────────────────────────────────────
router.get('/mentoring',                protect, allowRoles('MENTOR', ...ADMIN), getMentoringInternships);
router.put('/mentoring/:ilmId/monthly-review', protect, allowRoles('MENTOR', ...ADMIN), submitMonthlyReview);
router.put('/:ilmId/logs/:logId/score', protect, allowRoles('MENTOR', ...ADMIN), scoreDailyLog);

// ── Intern: Offer Flow ────────────────────────────────────────────────────────
router.post('/offer/accept',            protect, allowRoles('INTERN', 'STUDENT', 'PRO_STUDENT'), acceptOffer);

// ── Intern: My Internship ─────────────────────────────────────────────────────
router.get('/my',                       protect, allowRoles('INTERN'), getMyInternship);
router.post('/my/daily-log',            protect, allowRoles('INTERN'), submitDailyLog);

// Daily log route used by DailyLog.jsx (/ilm/daily-log POST)
router.post('/daily-log',               protect, allowRoles('INTERN'), submitDailyLog);

// ── Final Exam & Certificate ──────────────────────────────────────────────────
router.get('/exam/generate',            protect, allowRoles('INTERN'), generateExam);
router.post('/exam/submit',             protect, allowRoles('INTERN'), submitExam);
router.post('/exam/attempt',            protect, allowRoles('INTERN'), attemptExam);

router.post('/certificate/share-linkedin', protect, allowRoles('INTERN'), shareLinkedIn);
router.post('/certificate/dev-generate', protect, allowRoles('INTERN', 'STUDENT', 'PRO_STUDENT'), generateDevCertificate); // DEV OVERRIDE
router.get('/verify/:certId', verifyCertificate); // public

module.exports = router;
