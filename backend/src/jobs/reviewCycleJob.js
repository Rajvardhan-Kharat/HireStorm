const cron = require('node-cron');
const Internship = require('../models/Internship');
const { notify } = require('../services/notificationService');
const { sendDailyLogReminder, sendMonthlyReviewNotice } = require('../services/emailService');
const User = require('../models/User');

// ── Daily Log Reminder — Runs at 9 AM IST every weekday ─────────────────
cron.schedule('30 3 * * 1-5', async () => {
  try {
    console.log('[CRON] Running daily log reminder...');
    const activeInternships = await Internship.find({ status: 'ACTIVE' }).populate('intern', 'email profile.firstName');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (const internship of activeInternships) {
      const alreadySubmitted = internship.dailyLogs.some(log => {
        const d = new Date(log.date); d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
      if (!alreadySubmitted) {
        await sendDailyLogReminder(internship.intern.email, internship.intern.profile.firstName);
        await notify({ recipientId: internship.intern._id, type: 'DAILY_LOG_REMINDER', title: '⏰ Daily Log Reminder', message: "Don't forget to submit today's work log!", link: '/ilm/daily-log', channel: ['IN_APP'] });
      }
    }
  } catch (err) {
    console.error('[CRON] Daily log reminder error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

const { countWorkingDaysBetween } = require('../utils/workingDays');

// ── Monthly Review Trigger — Runs every weekday at 9 AM IST ─────
// Pings the Admin/Mentor exactly when 30, 60, or 90 working days have passed
cron.schedule('30 3 * * 1-5', async () => {
  try {
    console.log('[CRON] Running 30-day working-day review trigger...');
    const activeInternships = await Internship.find({ status: 'ACTIVE' })
      .populate('intern', 'email profile.firstName')
      .populate('mentor', '_id');

    const today = new Date();

    for (const internship of activeInternships) {
      if (!internship.startDate) continue;

      const workingDaysElapsed = countWorkingDaysBetween(internship.startDate, today);

      // Check if it's exactly the 30th, 60th, or 90th working day
      if (workingDaysElapsed > 0 && workingDaysElapsed % 30 === 0 && workingDaysElapsed <= 90) {
        const month = workingDaysElapsed / 30; // 1, 2, or 3

        const alreadyReviewed = internship.monthlyReviews.some(
          r => r.month === month && r.status === 'COMPLETED'
        );

        if (!alreadyReviewed) {
          await notify({
            recipientId: internship.mentor._id,
            type: 'MONTHLY_REVIEW_DUE',
            title: `Month ${month} Review Due`,
            message: `Please complete the Month ${month} assessment for ${internship.intern.profile.firstName}. They have completed ${workingDaysElapsed} working days.`,
            link: `/ilm/mentoring/${internship._id}`,
            channel: ['IN_APP', 'EMAIL'],
          });
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Monthly review trigger error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

console.log('✅ Cron jobs registered');
