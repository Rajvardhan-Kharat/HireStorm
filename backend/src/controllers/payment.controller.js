const { createOrder, verifyPayment } = require('../services/paymentService');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Company = require('../models/Company');
const Course = require('../models/Course');

// POST /api/v1/payments/create-order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { type, amount, metadata } = req.body;
    const { order, transactionId } = await createOrder({
      amount,
      type,
      userId: req.user._id,
      companyId: req.user.companyRef,
      metadata,
    });
    res.json({ success: true, order, transactionId, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/v1/payments/verify
exports.verifyPaymentHandler = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const transaction = await verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

    // Post-payment fulfillment
    if (transaction.type === 'PRO_SUBSCRIPTION') {
      await User.findByIdAndUpdate(transaction.user, {
        role: 'PRO_STUDENT',
        'subscription.plan': 'PRO',
        'subscription.startDate': new Date(),
        'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'subscription.razorpaySubscriptionId': razorpayPaymentId,
      });
    } else if (transaction.type === 'COMPANY_TIER_UPGRADE') {
      const { tier } = transaction.metadata;
      const tierFeatures = {
        STARTER: { topListingSlots: 0, bulkHiringTools: false, premiumATS: false, candidateDBAccess: false, hackathonHosting: false },
        GROWTH: { topListingSlots: 3, bulkHiringTools: true, premiumATS: true, candidateDBAccess: true, hackathonHosting: true },
        ENTERPRISE: { topListingSlots: 10, bulkHiringTools: true, premiumATS: true, candidateDBAccess: true, hackathonHosting: true },
      };
      await Company.findByIdAndUpdate(transaction.company, {
        'subscription.tier': tier,
        'subscription.features': tierFeatures[tier],
        'subscription.startDate': new Date(),
        'subscription.endDate': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    } else if (transaction.type === 'COURSE_PURCHASE') {
      await User.findByIdAndUpdate(transaction.user, { $push: { coursesEnrolled: transaction.metadata.courseId } });
      await Course.findByIdAndUpdate(transaction.metadata.courseId, { $inc: { totalEnrollments: 1 } });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/v1/payments/history
exports.getPaymentHistory = async (req, res) => {
  try {
    const query = req.user.companyRef
      ? { $or: [{ user: req.user._id }, { company: req.user.companyRef }] }
      : { user: req.user._id };
    const transactions = await Transaction.find(query).sort('-createdAt');
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
