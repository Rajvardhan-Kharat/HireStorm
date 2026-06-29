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

exports.getRevenueDashboard = async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const Company = require('../models/Company');
    const Internship = require('../models/Internship');
    const Listing = require('../models/Listing');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [allTxns, thisMonthTxns, lastMonthTxns, proStudents, paidCompanies, totalListings, activeInternships, proCompanies] = await Promise.all([
      Transaction.find({ status: 'SUCCESS' }).populate('user', 'profile.firstName profile.lastName email').populate('company', 'name').sort('-createdAt'),
      Transaction.find({ status: 'SUCCESS', createdAt: { $gte: thisMonthStart } }),
      Transaction.find({ status: 'SUCCESS', createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
      User.countDocuments({ role: 'PRO_STUDENT' }),
      Company.countDocuments({ 'subscription.tier': { $ne: 'FREE' } }),
      Listing.countDocuments({ status: 'ACTIVE' }),
      Internship.countDocuments({ status: 'ACTIVE' }),
      Company.countDocuments({ isPro: true }),
    ]);

    const totalRevenue   = allTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const mrr            = thisMonthTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const lastMonthRev   = lastMonthTxns.reduce((s, t) => s + (t.amount || 0), 0);
    const mrrGrowth      = lastMonthRev ? Math.round(((mrr - lastMonthRev) / lastMonthRev) * 100) : 100;

    // Revenue by type
    const byType = {};
    allTxns.forEach(t => { byType[t.type] = (byType[t.type] || 0) + t.amount; });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mTxns  = allTxns.filter(t => new Date(t.createdAt) >= mStart && new Date(t.createdAt) < mEnd);
      monthlyTrend.push({
        month: mStart.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: mTxns.reduce((s, t) => s + t.amount, 0),
        count: mTxns.length,
      });
    }

    // Top paying companies
    const companyRevMap = {};
    allTxns.filter(t => t.company).forEach(t => {
      const key = t.company._id.toString();
      if (!companyRevMap[key]) companyRevMap[key] = { name: t.company.name, total: 0, count: 0 };
      companyRevMap[key].total += t.amount;
      companyRevMap[key].count += 1;
    });
    const topCompanies = Object.values(companyRevMap).sort((a, b) => b.total - a.total).slice(0, 5);

    res.json({
      success: true,
      data: {
        totalRevenue, mrr, lastMonthRev, mrrGrowth,
        totalTransactions: allTxns.length,
        proStudents, paidCompanies, proCompanies, totalListings, activeInternships,
        byType,
        monthlyTrend,
        topCompanies,
        recentTransactions: allTxns.slice(0, 15),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
