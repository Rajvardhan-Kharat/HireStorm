const { Worker } = require('bullmq');
const { connection } = require('../queues/hackathonQueue');
const Hackathon = require('../../models/Hackathon');
const Team      = require('../../models/Team');
const { sendPhase1Rejection } = require('../../services/emailService');

const handleHackathonJob = async (job) => {
  console.log(`[Job Processor] Processing job: ${job.name}`);

  // ── Close Phase 1 submissions ─────────────────────────────────────────
  if (job.name === 'CLOSE_PHASE1_SUBMISSIONS') {
    const { hackathonId } = job.data;
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new Error(`Hackathon ${hackathonId} not found`);

    // Auto-reject teams that never submitted
    const emptyTeams = await Team.find({
      hackathon: hackathonId,
      stage:     'REGISTERED',            // never submitted phase 1
    }).populate('leader', 'email profile');

    for (const team of emptyTeams) {
      team.stage = 'REJECTED';
      await team.save();
      if (team.leader?.email) {
        await sendPhase1Rejection(team.leader.email, team.name).catch(e =>
          console.error(`[Job Processor] Email failed for ${team.name}:`, e.message)
        );
      }
    }

    console.log(`[Job Processor] Phase 1 closed for "${hackathon.title}" — auto-rejected ${emptyTeams.length} non-submitting teams.`);
  }

  // ── Close Phase 2 submissions ─────────────────────────────────────────
  if (job.name === 'CLOSE_PHASE2_SUBMISSIONS') {
    const { hackathonId } = job.data;
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new Error(`Hackathon ${hackathonId} not found`);

    // Auto-reject shortlisted teams that didn't submit phase 2
    const noSubmit = await Team.find({
      hackathon: hackathonId,
      stage:     'SHORTLISTED',    // was shortlisted but didn't submit
    });

    for (const team of noSubmit) {
      team.stage = 'REJECTED';
      await team.save();
    }

    // Mark hackathon as EVALUATION stage
    hackathon.status = 'EVALUATION';
    await hackathon.save();

    console.log(`[Job Processor] Phase 2 closed for "${hackathon.title}" — ${noSubmit.length} teams auto-rejected for no submission.`);
  }
};

const worker = new Worker('hackathonQueue', handleHackathonJob, { connection });

worker.on('completed', job => {
  console.log(`[BullMQ Worker] ✅ Job ${job.id} (${job.name}) completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[BullMQ Worker] ❌ Job ${job.id} (${job.name}) failed: ${err.message}`);
});

module.exports = { worker, handleHackathonJob };
