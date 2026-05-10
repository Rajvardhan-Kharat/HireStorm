require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const College = require('../models/College');

const generateTokens = (collegeId) => {
  const accessToken = jwt.sign(
    { id: collegeId, type: 'COLLEGE' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
  const refreshToken = jwt.sign(
    { id: collegeId, type: 'COLLEGE' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  return { accessToken, refreshToken };
};

// POST /api/v1/college/auth/login
const collegeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const college = await College.findOne({ email: email.toLowerCase() });
    if (!college || !college.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await college.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(college._id);
    college.refreshToken = refreshToken;
    await college.save({ validateBeforeSave: false });

    res
      .cookie('college_rt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        success: true,
        accessToken,
        college: college.toPublicProfile(),
      });
  } catch (err) {
    console.error('[collegeLogin]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/v1/college/auth/refresh
const collegeRefreshToken = async (req, res) => {
  try {
    const token = req.cookies?.college_rt;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'COLLEGE') return res.status(401).json({ success: false, message: 'Invalid token type' });

    const college = await College.findById(decoded.id);
    if (!college || college.refreshToken !== token || !college.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(college._id);
    college.refreshToken = newRefreshToken;
    await college.save({ validateBeforeSave: false });

    res
      .cookie('college_rt', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ success: true, accessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
  }
};

// POST /api/v1/college/auth/logout
const collegeLogout = async (req, res) => {
  try {
    const college = await College.findById(req.college._id);
    if (college) {
      college.refreshToken = null;
      await college.save({ validateBeforeSave: false });
    }
    res.clearCookie('college_rt');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/v1/college/auth/me
const getCollegeMe = async (req, res) => {
  try {
    res.json({ success: true, college: req.college.toPublicProfile() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { collegeLogin, collegeRefreshToken, collegeLogout, getCollegeMe };
