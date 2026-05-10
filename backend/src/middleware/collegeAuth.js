const jwt = require('jsonwebtoken');
const College = require('../models/College');

// Protect college routes
const protectCollege = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type !== 'COLLEGE') {
      return res.status(403).json({ success: false, message: 'Not a college token' });
    }

    const college = await College.findById(decoded.id).select('-password -refreshToken');
    if (!college || !college.isActive) {
      return res.status(401).json({ success: false, message: 'College not found or inactive' });
    }

    req.college = college;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// Protect admin routes that also allow college access
const protectAdminOrCollege = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.type === 'COLLEGE') {
      const college = await College.findById(decoded.id).select('-password -refreshToken');
      if (!college || !college.isActive) {
        return res.status(401).json({ success: false, message: 'College not found or inactive' });
      }
      req.college = college;
      req.actorType = 'COLLEGE';
    } else {
      const User = require('../models/User');
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'User not found or inactive' });
      }
      if (!['PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }
      req.user = user;
      req.actorType = 'ADMIN';
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protectCollege, protectAdminOrCollege };
