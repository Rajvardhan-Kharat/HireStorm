const ROLE_HIERARCHY = {
  SUPER_ADMIN: 9,
  PLATFORM_ADMIN: 8,
  COMPANY_ADMIN: 7,
  COMPANY_HR: 6,
  JUDGE: 5,
  MENTOR: 4,
  INTERN: 3,
  PRO_STUDENT: 2,
  STUDENT: 1,
};

/**
 * allowRoles(...roles) — only listed roles can proceed
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * minRole(role) — user's hierarchy level must be >= the required role
 */
const minRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[role] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * isPro — student must have PRO or higher subscription
 */
const isPro = (req, res, next) => {
  const proRoles = ['PRO_STUDENT', 'INTERN', 'MENTOR', 'JUDGE', 'COMPANY_HR', 'COMPANY_ADMIN', 'PLATFORM_ADMIN', 'SUPER_ADMIN'];
  if (!req.user || !proRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'PRO subscription required' });
  }
  next();
};

module.exports = { allowRoles, minRole, isPro };
