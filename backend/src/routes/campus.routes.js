const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { protectCollege } = require('../middleware/collegeAuth');
const { authLimiter } = require('../middleware/rateLimiter');
const { allowRoles } = require('../middleware/rbac');

const {
  collegeLogin, collegeRefreshToken, collegeLogout, getCollegeMe,
} = require('../controllers/collegeAuth.controller');

const {
  // Admin — colleges
  adminListColleges, adminCreateCollege, adminUpdateCollege, adminDeleteCollege,
  // Admin — drives
  adminCreateDrive, adminListDrives, adminUpdateDrive,
  adminListApplications, adminShortlistStudents,
  adminUpdateApplication, adminSelectStudentAsIntern,
  // Admin — pipeline
  adminSendAITest, adminScheduleInterview, adminSendCampusOffer,
  // Public test
  getAITest, submitAITest,
  // Offer accept/reject
  acceptCampusOffer, rejectCampusOffer,
  // Public form
  getDriveByToken, submitDriveApplication,
  // College portal
  collegeGetProfile, collegeGetDrives, collegeGetDriveApplications, collegeGetShortlisted,
  // Public
  getCollegePublicInfo,
} = require('../controllers/campus.controller');

// ── College Auth ──────────────────────────────────────────────────────────────
router.post('/auth/login',   authLimiter, collegeLogin);
router.post('/auth/refresh', collegeRefreshToken);
router.post('/auth/logout',  protectCollege, collegeLogout);
router.get('/auth/me',       protectCollege, getCollegeMe);

// ── College Portal (college-authenticated) ────────────────────────────────────
router.get('/portal/profile',                         protectCollege, collegeGetProfile);
router.get('/portal/drives',                          protectCollege, collegeGetDrives);
router.get('/portal/drives/:id/applications',         protectCollege, collegeGetDriveApplications);
router.get('/portal/drives/:id/shortlisted',          protectCollege, collegeGetShortlisted);

// ── Admin routes (platform admin only) ───────────────────────────────────────
router.get(   '/admin/list',                           protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListColleges);
router.post(  '/admin/create',                         protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminCreateCollege);

router.get(   '/admin/drives',                         protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListDrives);
router.post(  '/admin/drives',                         protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminCreateDrive);
router.put(   '/admin/drives/:id',                     protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateDrive);
router.get(   '/admin/drives/:id/applications',        protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListApplications);
router.post(  '/admin/drives/:id/shortlist',           protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminShortlistStudents);

// ── AI Test + Interview + Offer Pipeline ─────────────────────────────────────
router.post(  '/admin/applications/:appId/send-ai-test',       protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminSendAITest);
router.post(  '/admin/applications/:appId/schedule-interview',  protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminScheduleInterview);
router.post(  '/admin/applications/:appId/send-offer',          protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminSendCampusOffer);

router.patch( '/admin/applications/:appId',            protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateApplication);
router.post(  '/admin/applications/:appId/select',     protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminSelectStudentAsIntern);

// Generic college :id routes — must come AFTER all specific /admin/* routes
router.put(   '/admin/:id',                            protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateCollege);
router.delete('/admin/:id',                            protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminDeleteCollege);

// ── Public ─────────────────────────────────────────────────────────────────────
router.get('/public/:slug',          getCollegePublicInfo);
router.get('/apply/:token',          getDriveByToken);
router.post('/apply/:token',         submitDriveApplication);

// ── AI Test (public — student accesses via email link) ────────────────────────
router.get('/test/:token',           getAITest);
router.post('/test/:token/submit',   submitAITest);

// ── Offer Accept / Reject (public — via email magic link) ─────────────────────
router.get('/offer/accept',          acceptCampusOffer);
router.get('/offer/reject',          rejectCampusOffer);

module.exports = router;
