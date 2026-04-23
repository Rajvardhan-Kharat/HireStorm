'use strict';

/**
 * interview.controller.js  (Prompt 4)
 * ─────────────────────────────────────
 * Admin schedules interviews for Phase-2-shortlisted teams.
 * For every SHORTLISTED_2 team the backend:
 *   1. Creates a Google Calendar Event with a Google Meet link.
 *   2. Emails the calendar invite (with the generated Meet link) to the Group Leader.
 *
 * Routes:
 *   POST /api/v1/hackathons/:hackathonId/schedule-interviews
 *
 * Body:
 *   {
 *     interviews: [
 *       { teamId: "...", startTime: "2026-04-20T10:00:00+05:30", durationMinutes: 30 },
 *       ...
 *     ],
 *     description?: "Agenda / notes for all interviews"
 *   }
 *
 * If `interviews` array is omitted, all SHORTLISTED_2 teams for that hackathon
 * are auto-slotted starting from `startTime` in the body with `durationMinutes` gaps.
 */

const Hackathon = require('../models/Hackathon');
const Team      = require('../models/Team');
const { createInterviewEvent } = require('../services/calendarService');
const { sendInterviewInvite }  = require('../services/emailService');
const { notify }               = require('../services/notificationService');

/**
 * POST /api/v1/hackathons/:hackathonId/schedule-interviews
 * Admin-only
 */
exports.scheduleInterviews = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const {
      interviews: slotList,
      description = 'HireStorm Hackathon — Final Interview Round',
    } = req.body;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }

    // ── Resolve teams to schedule ────────────────────────────────────────────
    let teamsWithSlots = [];

    if (slotList && Array.isArray(slotList) && slotList.length > 0) {
      // Admin provided explicit per-team slots
      for (const slot of slotList) {
        const team = await Team.findOne({
          _id:       slot.teamId,
          hackathon: hackathonId,
          status:    'SHORTLISTED_2',
        }).populate('leader', 'email profile.firstName profile.lastName');

        if (!team) {
          console.warn(`[scheduleInterviews] Team ${slot.teamId} not SHORTLISTED_2 — skipping`);
          continue;
        }

        const start = new Date(slot.startTime);
        const end   = new Date(start.getTime() + (slot.durationMinutes || 30) * 60_000);
        teamsWithSlots.push({ team, start, end });
      }
    } else {
      // Auto-slot all SHORTLISTED_2 teams at 30-min intervals from `autoStartTime`
      const { autoStartTime, durationMinutes = 30 } = req.body;
      if (!autoStartTime) {
        return res.status(400).json({
          success: false,
          message: 'Provide either `interviews` array or `autoStartTime` for auto-slotting',
        });
      }

      const teams = await Team.find({ hackathon: hackathonId, status: 'SHORTLISTED_2' })
        .populate('leader', 'email profile.firstName profile.lastName');

      let cursor = new Date(autoStartTime);
      for (const team of teams) {
        const start = new Date(cursor);
        const end   = new Date(cursor.getTime() + durationMinutes * 60_000);
        teamsWithSlots.push({ team, start, end });
        cursor = new Date(end.getTime() + 10 * 60_000); // 10-min buffer between slots
      }
    }

    if (teamsWithSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No SHORTLISTED_2 teams found or provided for scheduling',
      });
    }

    // ── Create Calendar events + send emails ─────────────────────────────────
    const results = [];

    for (const { team, start, end } of teamsWithSlots) {
      try {
        const leader      = team.leader;
        const leaderEmail = leader?.email;

        // Build attendee list
        const attendees = leaderEmail ? [leaderEmail] : [];

        // Create Google Calendar event with Meet link
        const { eventId, meetLink, htmlLink } = await createInterviewEvent({
          summary:        `HireStorm Interview — Team "${team.name}"`,
          description:    `${description}\n\nHackathon: ${hackathon.title}\nTeam: ${team.name}`,
          startTime:      start,
          endTime:        end,
          attendeeEmails: attendees,
        });

        // Email the Group Leader with the Meet link + calendar link
        if (leaderEmail) {
          await sendInterviewInvite(
            leaderEmail,
            leader?.profile?.firstName || 'Team Leader',
            team.name,
            hackathon.title,
            start,
            meetLink,
            htmlLink
          );

          await notify({
            recipientId: leader._id,
            type:        'HACKATHON',
            title:       '📅 Interview Scheduled',
            message:     `Your interview for ${hackathon.title} is scheduled. Check your email for the Google Meet link.`,
            link:        `/hackathons/${hackathon.slug || hackathon._id}`,
            channel:     ['IN_APP'],
          });
        }

        results.push({
          teamId:    team._id,
          teamName:  team.name,
          eventId,
          meetLink,
          htmlLink,
          startTime: start,
          endTime:   end,
          status:    'scheduled',
        });

        console.log(`[scheduleInterviews] ✅ Scheduled interview for "${team.name}" — Meet: ${meetLink}`);

      } catch (err) {
        console.error(`[scheduleInterviews] ❌ Failed for team "${team.name}":`, err.message);
        results.push({
          teamId:   team._id,
          teamName: team.name,
          status:   'failed',
          error:    err.message,
        });
      }
    }

    const scheduled = results.filter(r => r.status === 'scheduled').length;
    const failed    = results.filter(r => r.status === 'failed').length;

    return res.json({
      success: true,
      message: `${scheduled} interview(s) scheduled, ${failed} failed.`,
      data:    results,
    });

  } catch (err) {
    console.error('[scheduleInterviews]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
