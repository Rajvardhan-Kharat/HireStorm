const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { allowRoles } = require('../middleware/rbac');
const { createPaymentOrder, verifyPaymentHandler, getPaymentHistory, activateProBypass, activateCompanyUpgradeBypass, activateCompanyProBypass } = require('../controllers/payment.controller');

router.post('/create-order', protect, paymentLimiter, createPaymentOrder);
router.post('/verify',       protect, paymentLimiter, verifyPaymentHandler);
router.get('/history',       protect, getPaymentHistory);

// ⚠️ TEMP: Bypass routes — remove when real payment is live
router.post('/activate-pro-bypass',              protect, allowRoles('STUDENT','PRO_STUDENT'),       activateProBypass);
router.post('/company-upgrade-bypass',           protect, allowRoles('COMPANY_ADMIN'),              activateCompanyUpgradeBypass);
router.post('/company-pro-bypass',               protect, allowRoles('COMPANY_ADMIN'),              activateCompanyProBypass);

module.exports = router;
