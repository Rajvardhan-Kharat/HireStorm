const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    logo: String,
    website: String,
    industry: String,
    size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    description: String,
    location: String,
    isVerified: { type: Boolean, default: false },
    subscription: {
      tier: { type: String, enum: ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'], default: 'FREE' },
      startDate: Date,
      endDate: Date,
      features: {
        topListingSlots: { type: Number, default: 0 },
        bulkHiringTools: { type: Boolean, default: false },
        premiumATS: { type: Boolean, default: false },
        candidateDBAccess: { type: Boolean, default: false },
        hackathonHosting: { type: Boolean, default: false },
      },
      razorpaySubscriptionId: String,
    },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hrUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
