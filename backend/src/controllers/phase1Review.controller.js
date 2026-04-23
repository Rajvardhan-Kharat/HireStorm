'use strict';

/**
 * phase1Review.controller.js  (Prompt 3)
 * ─────────────────────────────────────────
 * Admin reviews Phase 1 (Ideation) submissions and sets team status to
 * SHORTLISTED_1 or REJECTED.  Automated emails fire immediately.
 *
 * Routes consumed:
 *   PUT  /api/v1/hackathons/:hackathonId/teams/:teamId/review-phase1
 *
 * Body:
 *   { decision: 'SHORTLISTED_1' | 'REJECTED', feedback?: string }
 */

const Hackathon = require('../models/Hackathon');
const Team      = require('../models/Team');
const { notify } = require('../services/notificationService');
const {
  sendPhase1Rejected,
  sendPhase1Shortlisted,
} = require('../services/emailService');

/**
 * PUT /api/v1/hackathons/:hackathonId/teams/:teamId/review-phase1
 * Admin-only — requires PLATFORM_ADMIN | SUPER_ADMIN
 */
exports.reviewPhase1 = async (req, res) => {
  try {
    const { hackathonId, teamId } = req.params;
    const { decision, feedback = '' } = req.body;

    // ── Validate decision ────────────────────────────────────────────────────
    const ALLOWED = ['SHORTLISTED_1', 'REJECTED'];
    if (!ALLOWED.includes(decision)) {
      return res.status(400).json({
        success: false,
        message: `decision must be one of: ${ALLOWED.join(', ')}`,
      });
    }

    // ── Fetch hackathon & team ───────────────────────────────────────────────
    const [hackathon, team] = await Promise.all([
      Hackathon.findById(hackathonId),
      Team.findOne({ _id: teamId, hackathon: hackathonId })
        .populate('leader', 'email profile.firstName profile.lastName'),
    ]);

    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Guard: only review teams that have submitted Phase 1
    const hasSubmission = team.phase1Submission?.ppt || team.phase1Submission?.video;
    if (!hasSubmission) {
      return res.status(400).json({
        success: false,
        message: 'This team has not submitted a Phase 1 entry',
      });
    }

    // ── Update team status ───────────────────────────────────────────────────
    const prevStatus = team.status;
    team.status = decision;
    await team.save();

    // ── Fire automated email + in-app notification ───────────────────────────
    const leader     = team.leader;
    const leaderName = leader?.profile?.firstName || 'Team Leader';
    const leaderEmail = leader?.email;

    if (leaderEmail) {
      if (decision === 'REJECTED') {
        // "Sorry, you didn't make it" email
        await sendPhase1Rejected(
          leaderEmail,
          leaderName,
          team.name,
          hackathon.title
        );

        await notify({
          recipientId: leader._id,
          type:        'HACKATHON',
          title:       `Phase 1 Result — Team "${team.name}"`,
          message:     `Unfortunately your team did not advance to Phase 2 of ${hackathon.title}.`,
          link:        `/hackathons/${hackathon.slug || hackathon._id}`,
          channel:     ['IN_APP'],
        });

      } else {
        // "Congratulations! You have 24 hours to submit your final GitHub repo"
        // phase2Deadline pulled directly from the Hackathon model
        await sendPhase1Shortlisted(
          leaderEmail,
          leaderName,
          team.name,
          hackathon.title,
          hackathon.phase2Deadline
        );

        await notify({
          recipientId: leader._id,
          type:        'HACKATHON',
          title:       `🎉 Shortlisted! — Team "${team.name}"`,
          message:     `Your team is through to Phase 2 of ${hackathon.title}! Submit your GitHub repo before the deadline.`,
          link:        `/hackathons/${hackathon.slug || hackathon._id}`,
          channel:     ['IN_APP', 'EMAIL'],
        });
      }
    }

    return res.json({
      success: true,
      message: `Team "${team.name}" marked as ${decision}. Leader notified via email.`,
      data: {
        teamId:      team._id,
        teamName:    team.name,
        prevStatus,
        newStatus:   decision,
        leaderEmail: leaderEmail || null,
        phase2Deadline: hackathon.phase2Deadline,
      },
    });

  } catch (err) {
    console.error('[reviewPhase1]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/hackathons/:hackathonId/phase1-submissions
 * Admin — lists all Phase 1 submissions for review.
 */
exports.getPhase1Submissions = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const teams = await Team.find({ hackathon: hackathonId })
      .populate('leader', 'email profile.firstName profile.lastName profile.avatar')
      .populate('members.user', 'profile.firstName profile.lastName email')
      .select('name college status phase1Submission leader members createdAt')
      .sort('-createdAt');

    // Separate submitted from not yet submitted
    const withSubmission    = teams.filter(t => t.phase1Submission?.ppt || t.phase1Submission?.video);
    const withoutSubmission = teams.filter(t => !t.phase1Submission?.ppt && !t.phase1Submission?.video);

    return res.json({
      success: true,
      data: {
        submitted:    withSubmission,
        notSubmitted: withoutSubmission,
        counts: {
          total:          teams.length,
          submitted:      withSubmission.length,
          notSubmitted:   withoutSubmission.length,
          shortlisted:    teams.filter(t => t.status === 'SHORTLISTED_1').length,
          rejected:       teams.filter(t => t.status === 'REJECTED').length,
          pending:        teams.filter(t => t.status === 'PENDING').length,
        },
      },
    });
  } catch (err) {
    console.error('[getPhase1Submissions]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
