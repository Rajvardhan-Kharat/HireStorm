const Team                  = require('../models/Team');
const { sendInterviewInvite } = require('../services/emailService');
const { notify }            = require('../services/notificationService');

let calendarService;
try {
  calendarService = require('../services/calendarService');
} catch { calendarService = null; }

/**
 * POST /api/v1/hackathons/:hackathonId/schedule-interviews
 * Body: { startDate, slotDurationMinutes?, gapMinutes? }
 */
exports.scheduleInterviews = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { startDate, slotDurationMinutes = 30, gapMinutes = 10 } = req.body;

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'startDate is required' });
    }

    const teams = await Team.find({
      hackathon: hackathonId,
      stage: 'EVALUATED',
    }).populate('leader', 'email profile');

    if (!teams.length) {
      return res.status(400).json({ success: false, message: 'No evaluated teams found. Teams must have submitted Phase 2.' });
    }

    let currentTime = new Date(startDate).getTime();
    const results   = [];

    for (const team of teams) {
      const leaderEmail     = team.leader?.email;
      const leaderFirstName = team.leader?.profile?.firstName || 'Leader';
      let meetLink = 'https://meet.google.com/new'; // fallback

      // Try Google Calendar — if credentials exist
      if (calendarService && process.env.GOOGLE_REFRESH_TOKEN) {
        try {
          const event = await calendarService.createInterviewEvent({
            teamName:        team.name,
            leaderEmail,
            startTime:       currentTime,
            durationMinutes: slotDurationMinutes,
          });
          meetLink = event.meetLink || meetLink;
        } catch (calErr) {
          console.warn(`[scheduleInterviews] Google Calendar failed for team ${team._id}: ${calErr.message}`);
        }
      }

      const memberEmails = team.members.map(m => m.email).filter(Boolean);
      const memberIds = team.members.filter(m => m.user).map(m => m.user);

      if (memberEmails.length > 0) {
        await Promise.all(memberEmails.map(email => 
          sendInterviewInvite(email, team.name, meetLink, currentTime)
        ));
      }
      
      await Promise.all(memberIds.map(userId => 
        notify({
          recipientId: userId,
          type:    'HACKATHON',
          title:   '📅 Interview Scheduled!',
          message: `Your interview for team "${team.name}" has been scheduled. Join via Google Meet at the scheduled time.`,
          link:    meetLink,
          channel: ['IN_APP'],
        })
      ));

      // Advance team to shortlisted for interview
      team.stage = 'EVALUATED';
      await team.save();

      results.push({
        teamId:     team._id,
        teamName:   team.name,
        leaderEmail,
        meetLink,
        slot:       new Date(currentTime),
      });

      currentTime += (slotDurationMinutes + gapMinutes) * 60000;
    }

    res.json({
      success: true,
      message: `Scheduled ${results.length} interviews.`,
      data:    results,
    });
  } catch (err) {
    console.error('[scheduleInterviews]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
