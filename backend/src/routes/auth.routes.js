const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register, login, refreshToken, logout, verifyEmail,
  forgotPassword, resetPassword,
  getMe, updateCompany, updateProfile
} = require('../controllers/auth.controller');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password',        authLimiter, forgotPassword);
router.post('/reset-password/:token',  authLimiter, resetPassword);
router.get('/me',                  protect, getMe);
router.put('/profile',             protect, updateProfile);
router.put('/company',             protect, updateCompany);

module.exports = router;
