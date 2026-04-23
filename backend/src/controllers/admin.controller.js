const User = require('../models/User');
const Company = require('../models/Company');
const Transaction = require('../models/Transaction');
const Internship = require('../models/Internship');
const Hackathon = require('../models/Hackathon');
const Listing = require('../models/Listing');

// GET /api/v1/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalCompanies, totalHackathons, activeInternships, totalRevenue] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Hackathon.countDocuments(),
      Internship.countDocuments({ status: 'ACTIVE' }),
      Transaction.aggregate([{ $match: { status: 'SUCCESS' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    const revenue = totalRevenue[0]?.total || 0;
    const recentTransactions = await Transaction.find({ status: 'SUCCESS' }).sort('-createdAt').limit(10).populate('user', 'profile.firstName profile.lastName email');
    res.json({ success: true, data: { totalUsers, totalCompanies, totalHackathons, activeInternships, revenue, recentTransactions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ email: new RegExp(search, 'i') }, { 'profile.firstName': new RegExp(search, 'i') }];
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -refreshToken').skip((page - 1) * limit).limit(Number(limit)).sort('-createdAt'),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-passwordHash');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('admins', 'profile.firstName profile.lastName email').sort('-createdAt');
    res.json({ success: true, data: companies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    res.json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const [txns, total] = await Promise.all([
      Transaction.find(filter).populate('user', 'profile.firstName email').populate('company', 'name').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);
    res.json({ success: true, data: txns, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
