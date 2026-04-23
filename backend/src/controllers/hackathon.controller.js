const Hackathon        = require('../models/Hackathon');
const Team             = require('../models/Team');
const Submission       = require('../models/Submission');
const ProblemStatement = require('../models/ProblemStatement');
const User             = require('../models/User');
const { notify }       = require('../services/notificationService');
const {
  sendTeamInvite,
  sendBulkHackathonStarted,
} = require('../services/emailService');
const { hackathonQueue, scheduleHackathonJob } = require('../jobs/queues/hackathonQueue');
const crypto = require('crypto');

// ── List Hackathons ───────────────────────────────────────────────────────────
exports.getHackathons = async (req, res) => {
  try {
    const { status, page = 1, limit = 9 } = req.query;
    const filter = { status: { $ne: 'DRAFT' } };
    if (status) filter.status = status;
    const [hackathons, total] = await Promise.all([
      Hackathon.find(filter)
        .skip((page - 1) * limit).limit(Number(limit))
        .sort('-createdAt'),
      Hackathon.countDocuments(filter),
    ]);
    res.json({ success: true, data: hackathons, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Single Hackathon ──────────────────────────────────────────────────────────
exports.getHackathon = async (req, res) => {
  try {
    const isValidId = require('mongoose').Types.ObjectId.isValid(req.params.slug);
    const query = isValidId
      ? { $or: [{ slug: req.params.slug }, { _id: req.params.slug }] }
      : { slug: req.params.slug };

    const hack = await Hackathon.findOne(query).populate('problemStatements');
    if (!hack) return res.status(404).json({ success: false, message: 'Hackathon not found' });
    res.json({ success: true, data: hack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Create Hackathon (admin) ──────────────────────────────────────────────────
exports.createHackathon = async (req, res) => {
  try {
    const hack = await Hackathon.create({
      ...req.body,
      organizer: req.user._id,
    });
    res.status(201).json({ success: true, data: hack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Hackathon ──────────────────────────────────────────────────────────
exports.updateHackathon = async (req, res) => {
  try {
    const hack = await Hackathon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: hack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Publish Hackathon ─────────────────────────────────────────────────────────
exports.publishHackathon = async (req, res) => {
  try {
    const hack = await Hackathon.findByIdAndUpdate(
      req.params.id, { status: 'REGISTRATION_OPEN' }, { new: true }
    );
    res.json({ success: true, data: hack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Start Hackathon ───────────────────────────────────────────────────────────
exports.startHackathon = async (req, res) => {
  try {
    const hack = await Hackathon.findById(req.params.id);
    if (!hack) return res.status(404).json({ success: false, message: 'Hackathon not found' });
    if (hack.isStarted) return res.status(400).json({ success: false, message: 'Already started' });

    const now = new Date();
    const MS_24H = 24 * 60 * 60 * 1000;
    const MS_48H = 48 * 60 * 60 * 1000;

    const phase1Deadline = new Date(now.getTime() + MS_24H);
    const phase2Deadline = new Date(now.getTime() + MS_48H);

    hack.status = 'ACTIVE';
    hack.isStarted = true;
    hack.timeline.hackathonStart = now;
    hack.timeline.phase1Deadline = phase1Deadline;
    hack.timeline.phase2Deadline = phase2Deadline;
    hack.timeline.hackathonEnd   = phase2Deadline;
    hack.phase1Deadline = phase1Deadline;
    hack.phase2Deadline = phase2Deadline;
    await hack.save();

    // Notify all group leaders
    const teams = await Team.find({ hackathon: hack._id }).populate('leader', 'email profile.firstName');
    const leaders = teams
      .filter(t => t.leader?.email)
      .map(t => ({ email: t.leader.email, firstName: t.leader.profile?.firstName || 'Leader' }));

    sendBulkHackathonStarted(leaders, hack.title, phase1Deadline, phase2Deadline);

    // Schedule BullMQ jobs
    const jobData = { hackathonId: hack._id.toString() };
    await Promise.all([
      scheduleHackathonJob('CLOSE_PHASE1_SUBMISSIONS', jobData, phase1Deadline),
      scheduleHackathonJob('CLOSE_PHASE2_SUBMISSIONS', jobData, phase2Deadline),
    ]);

    res.json({
      success: true,
      message: `Hackathon started! ${leaders.length} leaders notified. Deadline jobs scheduled.`,
      data: { hackathonId: hack._id, phase1Deadline, phase2Deadline, leadersEmailed: leaders.length },
    });
  } catch (err) {
    console.error('[startHackathon]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Advance Stage ─────────────────────────────────────────────────────────────
exports.advanceStage = async (req, res) => {
  try {
    const STAGES = ['DRAFT','REGISTRATION_OPEN','REGISTRATION_CLOSED','ACTIVE','SHORTLISTING','HACKING','EVALUATION','COMPLETED'];
    const hack = await Hackathon.findById(req.params.id);
    const idx = STAGES.indexOf(hack.status);
    if (idx === STAGES.length - 1) return res.status(400).json({ success: false, message: 'Already at final stage' });
    hack.status = STAGES[idx + 1];
    await hack.save();
    res.json({ success: true, data: hack });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const submissions = await Submission.find({ hackathon: req.params.id, stage: 'FINAL' })
      .populate('team', 'name college')
      .sort('-averageScore');
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Problem Statements ────────────────────────────────────────────────────────
exports.getProblems = async (req, res) => {
  try {
    const problems = await ProblemStatement.find({ hackathon: req.params.hackathonId });
    res.json({ success: true, data: problems });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createProblem = async (req, res) => {
  try {
    const ps = await ProblemStatement.create({ ...req.body, hackathon: req.params.hackathonId });
    await Hackathon.findByIdAndUpdate(req.params.hackathonId, { $push: { problemStatements: ps._id } });
    res.status(201).json({ success: true, data: ps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lockProblem = async (req, res) => {
  try {
    const team = await Team.findOne({ hackathon: req.params.hackathonId, leader: req.user._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    if (team.isProblemLocked) return res.status(400).json({ success: false, message: 'Problem already locked' });
    const ps = await ProblemStatement.findOne({ _id: req.params.psId });
    if (!ps) return res.status(400).json({ success: false, message: 'Problem not available' });
    team.problemStatement = ps._id; team.isProblemLocked = true;
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Teams ─────────────────────────────────────────────────────────────────────
exports.registerTeam = async (req, res) => {
  try {
    const hack = await Hackathon.findById(req.params.hackathonId);
    if (!hack || hack.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ success: false, message: 'Registration is not open' });
    }
    // Check already registered
    const existing = await Team.findOne({ hackathon: hack._id, leader: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already registered a team' });

    const paymentStatus = hack.entryFee === 0 ? 'WAIVED' : 'PENDING';
    const team = await Team.create({
      hackathon: hack._id,
      leader:    req.user._id,
      name:      req.body.name,
      college:   req.body.college || '',
      members:   [{ user: req.user._id, role: 'Leader', email: req.user.email }],
      paymentStatus,
    });
    await Hackathon.findByIdAndUpdate(hack._id, { $inc: { totalRegistrations: 1 } });
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({
      hackathon: req.params.hackathonId,
      'members.user': req.user._id,
    })
      .populate('members.user', 'profile email')
      .populate('leader', 'profile email')
      .populate('problemStatement');
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('members.user', 'profile email')
      .populate('leader', 'profile email')
      .populate('problemStatement');
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.inviteToTeam = async (req, res) => {
  try {
    const { teamId, email } = req.body;
    const team = await Team.findOne({ _id: teamId, leader: req.user._id });
    if (!team) return res.status(404).json({ success: false, message: 'Team not found or you are not the leader' });
    const hack = await Hackathon.findById(team.hackathon);
    if (team.members.length >= hack.teamConfig.maxSize) {
      return res.status(400).json({ success: false, message: 'Team is full' });
    }
    const token = crypto.randomBytes(20).toString('hex');
    team.invites.push({ email, token });
    await team.save();
    const inviteUrl = `${process.env.CLIENT_URL}/hackathons/${hack.slug}/accept-invite/${token}`;
    await sendTeamInvite(email, team.name, inviteUrl);
    res.json({ success: true, message: 'Invite sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const team = await Team.findOne({ 'invites.token': req.params.token });
    if (!team) return res.status(404).json({ success: false, message: 'Invalid invite' });
    const invite = team.invites.find(i => i.token === req.params.token);
    if (invite.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Invite already used' });
    invite.status = 'ACCEPTED';
    team.members.push({ user: req.user._id, role: 'Member', email: req.user.email });
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Phase 1 Submissions (admin-facing list) ───────────────────────────────────
exports.getPhase1Submissions = async (req, res) => {
  try {
    const teams = await Team.find({ hackathon: req.params.hackathonId })
      .populate('leader', 'profile email')
      .populate('members.user', 'profile email')
      .sort('-updatedAt');
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Ideation Submit (Phase 1) ─────────────────────────────────────────────────
exports.submitIdeation = async (req, res) => {
  try {
    const team = await Team.findOne({ hackathon: req.params.hackathonId, leader: req.user._id });
    if (!team) return res.status(403).json({ success: false, message: 'Only group leaders can submit' });
    const { pptUrl, videoUrl, proposedSolution } = req.body;
    team.phase1Submission = { pptUrl, videoUrl, proposedSolution, submittedAt: new Date() };
    team.stage = 'IDEATION_SUBMITTED';
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Final Submit (Phase 2) ────────────────────────────────────────────────────
exports.submitFinal = async (req, res) => {
  try {
    const team = await Team.findOne({ hackathon: req.params.hackathonId, leader: req.user._id, stage: { $in: ['SHORTLISTED', 'IN_HACKATHON'] } });
    if (!team) return res.status(403).json({ success: false, message: 'Not eligible for final submission or only leaders can submit' });
    const { repoUrl, pptUrl, videoUrl } = req.body;
    team.phase2Submission = { repoUrl, pptUrl, videoUrl, submittedAt: new Date() };
    team.stage = 'EVALUATED';
    await team.save();
    res.json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const teams = await Team.find({ hackathon: req.params.hackathonId, stage: { $in: ['EVALUATED','WINNER'] } })
      .populate('leader', 'profile email')
      .populate('members.user', 'profile');
    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Razorpay Order (demo mode — creates order but allows skip) ────────────────
exports.createRegistrationOrder = async (req, res) => {
  try {
    const hack = await Hackathon.findById(req.params.hackathonId);
    if (!hack) return res.status(404).json({ success: false, message: 'Hackathon not found' });
    if (hack.entryFee === 0) return res.json({ success: true, free: true, message: 'This hackathon is free' });

    // Demo: return a mock order (skip real Razorpay for now)
    res.json({
      success: true,
      demo: true,
      orderId: `demo_order_${Date.now()}`,
      amount: hack.entryFee * 100,
      currency: 'INR',
      message: 'Demo mode — payment skipped. Team will be registered.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Score Submission (stubs needed by existing routes) ────────────────────────
exports.scoreSubmission = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Submission not found' });
    const { innovation, technicalDepth, feasibility, presentation, impact, feedback } = req.body;
    const totalScore = (innovation + technicalDepth + feasibility + presentation + impact);
    const entry = { judge: req.user._id, rubric: { innovation, technicalDepth, feasibility, presentation, impact }, totalScore, feedback, scoredAt: new Date() };
    const idx = sub.scores.findIndex(s => s.judge.toString() === req.user._id.toString());
    if (idx >= 0) sub.scores[idx] = entry; else sub.scores.push(entry);
    sub.averageScore = sub.scores.reduce((s, e) => s + e.totalScore, 0) / sub.scores.length;
    await sub.save();
    res.json({ success: true, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCheckIns = async (req, res) => res.json({ success: true, data: [] });
exports.completeCheckIn = async (req, res) => res.json({ success: true });

// ── Company: Get their hackathons ─────────────────────────────────────────────
exports.getCompanyHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({ organizer: req.user._id })
      .sort('-createdAt');
    res.json({ success: true, data: hackathons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Company: Propose / Create Hackathon (goes to DRAFT for admin approval) ────
exports.createCompanyHackathon = async (req, res) => {
  try {
    const hack = await Hackathon.create({
      ...req.body,
      organizer:  req.user._id,
      status:     'DRAFT',         // Always draft — admin publishes
      companyRef: req.user.companyRef,
    });
    res.status(201).json({ success: true, data: hack, message: 'Hackathon submitted for admin review.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
