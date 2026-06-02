const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register, login, refreshToken, logout, verifyEmail,
  forgotPassword, resetPassword,
  getMe, updateCompany, updateProfile, uploadAvatar,
  resendVerification
} = require('../controllers/auth.controller');
const { upload } = require('../middleware/upload');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password',        authLimiter, forgotPassword);
router.post('/reset-password/:token',  authLimiter, resetPassword);
router.post('/resend-verification',    authLimiter, resendVerification);

// ── TEMPORARY DIAGNOSTIC — remove after debugging ─────────────────────────
router.get('/test-email', async (req, res) => {
  const nodemailer = require('nodemailer');
  const to = req.query.to || process.env.SMTP_USER;
  const result = { smtpUser: process.env.SMTP_USER || 'NOT SET', smtpHost: process.env.SMTP_HOST, smtpPort: process.env.SMTP_PORT, smtpPassSet: !!process.env.SMTP_PASS };
  try {
    const t = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: parseInt(process.env.SMTP_PORT || '587'), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await t.verify();
    result.verify = 'OK';
    const info = await t.sendMail({ from: `"HireStorm Test" <${process.env.SMTP_USER}>`, to, subject: 'HireStorm SMTP Test', text: 'If you see this, SMTP works from Render!' });
    result.sent = true; result.messageId = info.messageId;
    res.json({ success: true, ...result });
  } catch (err) {
    res.json({ success: false, error: err.message, code: err.code, ...result });
  }
});
router.get('/me',                  protect, getMe);
router.put('/profile',             protect, updateProfile);
router.put('/company',             protect, updateCompany);
router.post('/avatar',             protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
