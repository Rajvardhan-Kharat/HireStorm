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
// NOTE: specific routes (/admin/list, /admin/drives) MUST come before generic /admin/:id
router.get(   '/admin/list',                     protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListColleges);
router.post(  '/admin/create',                   protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminCreateCollege);

router.get(   '/admin/drives',                   protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListDrives);
router.post(  '/admin/drives',                   protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminCreateDrive);
router.put(   '/admin/drives/:id',               protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateDrive);
router.get(   '/admin/drives/:id/applications',  protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminListApplications);
router.post(  '/admin/drives/:id/shortlist',     protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminShortlistStudents);
router.patch( '/admin/applications/:appId',      protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateApplication);
router.post(  '/admin/applications/:appId/select', protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminSelectStudentAsIntern);

// Generic college :id routes — must come AFTER all specific /admin/* routes
router.put(   '/admin/:id',                      protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminUpdateCollege);
router.delete('/admin/:id',                      protect, allowRoles('SUPER_ADMIN','PLATFORM_ADMIN'), adminDeleteCollege);

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/public/:slug',    getCollegePublicInfo);
router.get('/apply/:token',    getDriveByToken);
router.post('/apply/:token',   submitDriveApplication);

module.exports = router;
