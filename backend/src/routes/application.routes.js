const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const {
  applyToListing, getMyApplications, getListingApplications, updateApplicationStatus, withdrawApplication, getCompanyApplications,
} = require('../controllers/application.controller');

router.post('/', protect, allowRoles('STUDENT', 'PRO_STUDENT'), applyToListing);
router.get('/my', protect, getMyApplications);
router.get('/company', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), getCompanyApplications);
router.get('/listing/:listingId', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), getListingApplications);
router.put('/:id/status', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), updateApplicationStatus);
router.delete('/:id', protect, allowRoles('STUDENT', 'PRO_STUDENT'), withdrawApplication);

module.exports = router;
