/**
 * hackathonStatusJob.js
 * Runs every 5 minutes. Automatically transitions hackathon statuses
 * based on their configured timeline — no manual intervention needed.
 *
 * Transitions:
 *  DRAFT              → stays DRAFT until admin publishes
 *  REGISTRATION_OPEN  → ACTIVE       (when hackathonStart is reached)
 *  ACTIVE             → COMPLETED    (when hackathonEnd is reached)
 *  REGISTRATION_OPEN  → REGISTRATION_CLOSED (when registrationClose is reached, before hackathonStart)
 */

const cron = require('node-cron');
const Hackathon = require('../models/Hackathon');

async function syncHackathonStatuses() {
  const now = new Date();

  try {
    // 1) REGISTRATION_OPEN → ACTIVE  (start time reached)
    const toStart = await Hackathon.updateMany(
      {
        status: { $in: ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED'] },
        'timeline.hackathonStart': { $lte: now },
        'timeline.hackathonEnd':   { $gt: now },
      },
      { $set: { status: 'ACTIVE' } }
    );
    if (toStart.modifiedCount > 0)
      console.log(`[HackathonCron] ▶ Started ${toStart.modifiedCount} hackathon(s)`);

    // 2) REGISTRATION_OPEN → REGISTRATION_CLOSED  (reg deadline passed but hasn't started yet)
    const toClose = await Hackathon.updateMany(
      {
        status: 'REGISTRATION_OPEN',
        'timeline.registrationClose': { $lte: now },
        'timeline.hackathonStart':    { $gt: now },
      },
      { $set: { status: 'REGISTRATION_CLOSED' } }
    );
    if (toClose.modifiedCount > 0)
      console.log(`[HackathonCron] 🔒 Closed registrations for ${toClose.modifiedCount} hackathon(s)`);

    // 3) ACTIVE → COMPLETED  (end time reached)
    const toComplete = await Hackathon.updateMany(
      {
        status: 'ACTIVE',
        'timeline.hackathonEnd': { $lte: now },
      },
      { $set: { status: 'COMPLETED' } }
    );
    if (toComplete.modifiedCount > 0)
      console.log(`[HackathonCron] ✅ Completed ${toComplete.modifiedCount} hackathon(s)`);

  } catch (err) {
    console.error('[HackathonCron] Error syncing statuses:', err.message);
  }
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', syncHackathonStatuses);

// Also run immediately on server start to fix any missed transitions
syncHackathonStatuses();

console.log('[HackathonCron] ✅ Hackathon auto-status scheduler started (every 5 min)');

module.exports = { syncHackathonStatuses };
