const Hackathon  = require('../models/Hackathon');
const Team       = require('../models/Team');
const { notify } = require('../services/notificationService');
const {
  sendPhase1Rejection,
  sendPhase1Shortlisted,
} = require('../services/emailService');

/**
 * PUT /api/v1/hackathons/:hackathonId/teams/:teamId/review-phase1
 * Body: { action: 'SHORTLIST' | 'REJECT', feedback?: string }
 */
exports.reviewPhase1Submission = async (req, res) => {
  try {
    const { hackathonId, teamId } = req.params;
    const { action, feedback = '' } = req.body;

    if (!['SHORTLIST', 'REJECT'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be SHORTLIST or REJECT' });
    }

    const [hackathon, team] = await Promise.all([
      Hackathon.findById(hackathonId),
      Team.findOne({ _id: teamId, hackathon: hackathonId }).populate('leader', 'email profile'),
    ]);

    if (!hackathon) return res.status(404).json({ success: false, message: 'Hackathon not found' });
    if (!team)      return res.status(404).json({ success: false, message: 'Team not found' });

    if (!team.phase1Submission?.submittedAt) {
      return res.status(400).json({ success: false, message: 'This team has not submitted Phase 1 yet' });
    }

    const memberEmails = team.members.map(m => m.email).filter(Boolean);
    const memberIds = team.members.filter(m => m.user).map(m => m.user);

    if (action === 'SHORTLIST') {
      team.stage = 'SHORTLISTED';
      await team.save();
      
      if (memberEmails.length > 0) {
        await Promise.all(memberEmails.map(email => 
          sendPhase1Shortlisted(email, team.name, hackathon.phase2Deadline)
        ));
      }
      
      await Promise.all(memberIds.map(userId => 
        notify({
          recipientId: userId,
          type:    'HACKATHON',
          title:   '🎉 Your team has been shortlisted!',
          message: `Team "${team.name}" advanced to Phase 2. You have until the Phase 2 deadline to submit your final build.`,
          link:    `/hackathons/${hackathon.slug}/submit`,
          channel: ['IN_APP'],
        })
      ));
    } else {
      team.stage = 'REJECTED';
      await team.save();
      
      if (memberEmails.length > 0) {
        await Promise.all(memberEmails.map(email => 
          sendPhase1Rejection(email, team.name)
        ));
      }
      
      await Promise.all(memberIds.map(userId => 
        notify({
          recipientId: userId,
          type:    'HACKATHON',
          title:   'Hackathon Phase 1 Result',
        message: `Thank you for participating. Team "${team.name}" was not selected for Phase 2.`,
        link:    '/hackathons',
          channel: ['IN_APP'],
        })
      ));
    }

    res.json({
      success: true,
      message: `Team ${action === 'SHORTLIST' ? 'shortlisted' : 'rejected'} and leader notified.`,
    });
  } catch (err) {
    console.error('[reviewPhase1Submission]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
