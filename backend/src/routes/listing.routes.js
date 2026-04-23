const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles, minRole } = require('../middleware/rbac');
const {
  getListings, getListing, createListing, updateListing, deleteListing, getCompanyListings, getMyListings,
} = require('../controllers/listing.controller');

router.get('/', protect, getListings);
router.get('/my', protect, getMyListings);
router.get('/company/:companyId', protect, getCompanyListings);
router.get('/:id', protect, getListing);
router.post('/', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), createListing);
router.put('/:id', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), updateListing);
router.delete('/:id', protect, allowRoles('COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'), deleteListing);

module.exports = router;
