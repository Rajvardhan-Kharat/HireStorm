const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

const {
  getHackathons, getHackathon, createHackathon, updateHackathon,
  publishHackathon, startHackathon, advanceStage, getLeaderboard,
  getProblems, createProblem, lockProblem,
  registerTeam, getMyTeam, getTeam, inviteToTeam, acceptInvite,
  submitIdeation, submitFinal, getSubmissions, scoreSubmission,
  getPhase1Submissions, createRegistrationOrder,
  getCheckIns, completeCheckIn,
  getCompanyHackathons, createCompanyHackathon,
} = require('../controllers/hackathon.controller');

const { reviewPhase1Submission }  = require('../controllers/phase1AdminReview.controller');
const { scheduleInterviews }       = require('../controllers/interviewScheduler.controller');
const { selectWinningTeam }        = require('../controllers/offerPipeline.controller');

const ADMIN = ['PLATFORM_ADMIN', 'SUPER_ADMIN'];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getHackathons);

// ── Company Routes ───────────────────────────────────────────────────────────────
const COMPANY = ['COMPANY_ADMIN', 'COMPANY_HR'];
router.get('/company/mine',  protect, allowRoles(...COMPANY), getCompanyHackathons);
router.post('/company/new',  protect, allowRoles('COMPANY_ADMIN'), createCompanyHackathon);

// ── Admin CRUD ──────────────────────────────────────────────────────────────────
router.post('/',                 protect, allowRoles(...ADMIN), createHackathon);
router.put('/:id',               protect, allowRoles(...ADMIN), updateHackathon);
router.post('/:id/publish',      protect, allowRoles(...ADMIN), publishHackathon);
router.post('/:id/start',        protect, allowRoles(...ADMIN), startHackathon);
router.post('/:id/advance-stage',protect, allowRoles(...ADMIN), advanceStage);

// ── Single hackathon (slug or id) ─────────────────────────────────────────────
router.get('/:slug', getHackathon);
router.get('/:id/leaderboard', getLeaderboard);

// ── Problem Statements ────────────────────────────────────────────────────────
router.get( '/:hackathonId/problems',                protect, getProblems);
router.post('/:hackathonId/problems',                protect, allowRoles(...ADMIN), createProblem);
router.post('/:hackathonId/problems/:psId/lock',     protect, lockProblem);

// ── Teams ─────────────────────────────────────────────────────────────────────
router.post('/:hackathonId/teams/register',                protect, registerTeam);
router.get( '/:hackathonId/teams/my',                      protect, getMyTeam);
router.get( '/:hackathonId/teams/:teamId',                 protect, getTeam);
router.post('/:hackathonId/teams/invite',                  protect, inviteToTeam);
router.post('/:hackathonId/teams/accept-invite/:token',    protect, acceptInvite);

// ── Registration payment (demo) ───────────────────────────────────────────────
router.post('/:hackathonId/registration-order', protect, createRegistrationOrder);

// ── Submissions ───────────────────────────────────────────────────────────────
router.post('/:hackathonId/submit/ideation',              protect, submitIdeation);
router.post('/:hackathonId/submit/final',                 protect, submitFinal);
router.get( '/:hackathonId/submissions',                  protect, allowRoles(...ADMIN), getSubmissions);
router.post('/:hackathonId/submissions/:subId/score',     protect, scoreSubmission);

// ── Admin Pipeline ────────────────────────────────────────────────────────────
router.get('/:hackathonId/phase1-submissions',             protect, allowRoles(...ADMIN), getPhase1Submissions);
router.put('/:hackathonId/teams/:teamId/review-phase1',   protect, allowRoles(...ADMIN), reviewPhase1Submission);
router.post('/:hackathonId/schedule-interviews',           protect, allowRoles(...ADMIN), scheduleInterviews);
router.post('/:hackathonId/teams/:teamId/select-winner',   protect, allowRoles(...ADMIN), selectWinningTeam);

// ── Check-ins (stubs) ─────────────────────────────────────────────────────────
router.get( '/:hackathonId/checkins', protect, getCheckIns);
router.post('/:hackathonId/checkins/:checkInId/complete', protect, completeCheckIn);

module.exports = router;
