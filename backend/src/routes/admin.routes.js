const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');
const { getDashboard, getUsers, updateUserRole, getCompanies, verifyCompany, getTransactions } = require('../controllers/admin.controller');

const isAdmin = allowRoles('PLATFORM_ADMIN', 'SUPER_ADMIN');

router.get('/dashboard', protect, isAdmin, getDashboard);
router.get('/users', protect, isAdmin, getUsers);
router.put('/users/:id/role', protect, isAdmin, updateUserRole);
router.get('/companies', protect, isAdmin, getCompanies);
router.put('/companies/:id/verify', protect, isAdmin, verifyCompany);
router.get('/transactions', protect, isAdmin, getTransactions);

const Hackathon = require('../models/Hackathon');

router.get('/hackathons', protect, isAdmin, async (req, res) => {
  try {
    const hackathons = await Hackathon.find().sort('-createdAt');
    res.json({ success: true, data: hackathons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

