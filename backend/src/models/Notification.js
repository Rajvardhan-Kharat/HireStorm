const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'APPLICATION_STATUS', 'HACKATHON_STATUS', 'TEAM_INVITE',
        'DAILY_LOG_REMINDER', 'MONTHLY_REVIEW_DUE', 'OFFER_LETTER',
        'CERTIFICATE_READY', 'PAYMENT_SUCCESS', 'NEW_LISTING',
        'CHECK_IN_DUE', 'SHORTLIST_RESULT', 'MENTOR_MESSAGE',
      ],
      required: true,
    },
    title: String,
    message: String,
    link: String,
    isRead: { type: Boolean, default: false },
    channel: [{ type: String, enum: ['IN_APP', 'EMAIL'] }],
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
