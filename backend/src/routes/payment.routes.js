const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { createPaymentOrder, verifyPaymentHandler, getPaymentHistory, activateProBypass } = require('../controllers/payment.controller');

router.post('/create-order', protect, paymentLimiter, createPaymentOrder);
router.post('/verify',       protect, paymentLimiter, verifyPaymentHandler);
router.get('/history',       protect, getPaymentHistory);

// ⚠️ TEMP: Bypass route — remove when real payment is live
router.post('/activate-pro-bypass', protect, activateProBypass);

module.exports = router;
