const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    type: {
      type: String,
      enum: ['PRO_SUBSCRIPTION', 'COMPANY_TIER_UPGRADE', 'HACKATHON_ENTRY', 'COURSE_PURCHASE', 'LISTING_PIN', 'HACKATHON_SPONSOR'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
