const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
  return { accessToken, refreshToken };
};

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const allowedRoles = ['STUDENT', 'COMPANY_ADMIN'];
    const assignedRole = allowedRoles.includes(role) ? role : 'STUDENT';

    const verToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      email,
      password,
      role: assignedRole,
      profile: { firstName, lastName },
      emailVerificationToken: verToken,
    });

    await sendEmail(
      email,
      'Verify your HireStorm account',
      `Hi ${firstName}, click the link to verify your email.`,
      `<p>Hi ${firstName}, click below to verify your email:</p><a href="${process.env.CLIENT_URL}/verify-email/${verToken}">Verify Email</a>`
    );

    res.status(201).json({ success: true, message: 'Registration successful. Please verify your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken, user: user.toPublicProfile() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/auth/refresh-token
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, accessToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

// POST /api/v1/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/v1/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendEmail(
      user.email,
      'Password Reset Request',
      `Click the link to reset your password.`,
      `<p>Click below to reset your password (expires in 30 minutes):</p><a href="${process.env.CLIENT_URL}/reset-password/${resetToken}">Reset Password</a>`
    );
    res.json({ success: true, message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const Company = require('../models/Company');

// GET /api/v1/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('companyRef').populate('activeInternship');
    res.json({ success: true, user: { ...user.toPublicProfile(), company: user.companyRef } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/v1/auth/company
exports.updateCompany = async (req, res) => {
  try {
    const { name, industry, website, description, email, phone } = req.body;
    let company;
    if (req.user.companyRef) {
      company = await Company.findByIdAndUpdate(
        req.user.companyRef,
        { name, industry, website, description, email, phone },
        { new: true }
      );
    } else {
      company = await Company.create({
        name: name || 'My Company',
        industry, website, description, email, phone,
        admins: [req.user._id]
      });
      await User.findByIdAndUpdate(req.user._id, { companyRef: company._id });
    }
    
    // Give user back the updated public profile
    const user = await User.findById(req.user._id).populate('companyRef');
    res.json({ success: true, user: { ...user.toPublicProfile(), company: user.companyRef } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

