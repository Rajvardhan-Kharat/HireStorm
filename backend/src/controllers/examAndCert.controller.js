'use strict';

/**
 * examAndCert.controller.js  (Prompt 7)
 * ───────────────────────────────────────
 * Provides:
 *   1. GET  /api/v1/ilm/exam/generate    — Gemini generates 10 MCQs from the intern's recent logs.
 *   2. POST /api/v1/ilm/exam/submit      — Submit answers; if ≥ 40% correct → generate certificate.
 *
 * Certificate generation uses pdfkit, uploads to Cloudinary, and returns the link.
 * The "Share to LinkedIn" button is a frontend React component (see frontend/).
 */

const Internship = require('../models/Internship');
const User       = require('../models/User');
const { generateMCQs }    = require('../services/geminiService');
const { generateCertificate } = require('../services/certificateService');
const { sendCertificateEmail } = require('../services/emailService');
const { notify } = require('../services/notificationService');

// In-memory quiz session store (TTL 2h).
// In production, replace with Redis TTL keys.
const quizSessions = new Map();
const QUIZ_TTL_MS  = 2 * 60 * 60 * 1000; // 2 hours

// ── 1. Generate MCQ Exam ──────────────────────────────────────────────────────

/**
 * GET /api/v1/ilm/exam/generate
 * Intern must have isExamUnlocked = true.
 * Fetches recent daily logs → sends to Gemini → returns 10 MCQs (without answers).
 */
exports.generateExam = async (req, res) => {
  try {
    const internship = await Internship.findOne({
      intern:          req.user._id,
      isExamUnlocked:  true,
    });

    if (!internship) {
      return res.status(403).json({ success: false, message: 'Exam not unlocked yet. Complete all monthly reviews first.' });
    }

    if (internship.exam?.attemptedAt) {
      return res.status(400).json({ success: false, message: 'You have already attempted the final exam.' });
    }

    if (internship.dailyLogs.length < 5) {
      return res.status(400).json({ success: false, message: 'Insufficient daily logs to generate exam questions.' });
    }

    // Generate MCQs via Gemini
    const questions = await generateMCQs(internship.dailyLogs);

    // Store correct answers server-side keyed to internship ID
    const sessionId = `${internship._id}-${Date.now()}`;
    quizSessions.set(sessionId, {
      internshipId: internship._id.toString(),
      answers:      questions.map(q => q.answer),
      expiresAt:    Date.now() + QUIZ_TTL_MS,
    });

    // Auto-cleanup expired sessions
    setTimeout(() => quizSessions.delete(sessionId), QUIZ_TTL_MS);

    // Strip answers before sending to client
    const clientQuestions = questions.map(({ answer, ...rest }) => rest);

    return res.json({
      success:    true,
      sessionId,  // frontend must include this when submitting
      totalQuestions: clientQuestions.length,
      data:       clientQuestions,
    });

  } catch (err) {
    console.error('[generateExam]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. Submit Quiz ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/ilm/exam/submit
 * Body: { sessionId: "...", answers: ["A", "C", "B", ...] }
 *
 * Scoring:
 *   • >= 40% correct → PASS → generate certificate PDF → Cloudinary → email link
 *   • <  40% correct → FAIL
 */
exports.submitExam = async (req, res) => {
  try {
    const { sessionId, answers: submitted } = req.body;

    if (!sessionId || !Array.isArray(submitted)) {
      return res.status(400).json({ success: false, message: 'sessionId and answers array are required' });
    }

    // Retrieve session
    const session = quizSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Quiz session expired or invalid. Please regenerate the exam.' });
    }
    if (Date.now() > session.expiresAt) {
      quizSessions.delete(sessionId);
      return res.status(410).json({ success: false, message: 'Quiz session has expired. Please regenerate.' });
    }

    const internship = await Internship.findOne({
      _id:            session.internshipId,
      intern:         req.user._id,
      isExamUnlocked: true,
    });

    if (!internship) {
      return res.status(403).json({ success: false, message: 'Internship not found or exam not unlocked' });
    }
    if (internship.exam?.attemptedAt) {
      return res.status(400).json({ success: false, message: 'Exam already attempted' });
    }

    // ── Mark submission ───────────────────────────────────────────────────────
    const correctAnswers = session.answers;
    let   correct        = 0;

    submitted.forEach((ans, idx) => {
      if (ans === correctAnswers[idx]) correct++;
    });

    const total      = correctAnswers.length;
    const score      = Math.round((correct / total) * 100);
    const PASS_MARK  = 40; // >= 40% to pass (Prompt 7 spec)
    const isPassed   = score >= PASS_MARK;

    // Persist exam attempt
    internship.exam = { attemptedAt: new Date(), score, isPassed, passMark: PASS_MARK };
    await internship.save();

    // Cleanup session
    quizSessions.delete(sessionId);

    // ── Certificate generation on PASS ───────────────────────────────────────
    let certificateUrl = null;

    if (isPassed) {
      try {
        const { certificateUrl: certUrl } = await generateCertificate(internship._id);
        certificateUrl = certUrl;

        const intern = await User.findById(internship.intern);
        const name   = `${intern.profile?.firstName || ''} ${intern.profile?.lastName || ''}`.trim();

        await sendCertificateEmail(intern.email, name, certUrl);
        await notify({
          recipientId: internship.intern,
          type:        'CERTIFICATE_READY',
          title:       '🏆 Certificate of Completion Ready!',
          message:     `Congratulations! You scored ${score}% and passed the final exam. Your certificate is ready.`,
          link:        '/ilm/certificate',
          channel:     ['IN_APP', 'EMAIL'],
        });
      } catch (certErr) {
        console.error('[submitExam] Certificate generation failed:', certErr.message);
        // Don't fail the whole response — score is still recorded
      }
    } else {
      await notify({
        recipientId: internship.intern,
        type:        'HACKATHON',
        title:       'Final Exam Result',
        message:     `You scored ${score}%. The passing mark is ${PASS_MARK}%. Please contact your mentor.`,
        link:        '/ilm',
        channel:     ['IN_APP'],
      });
    }

    return res.json({
      success: true,
      data: {
        score,
        correct,
        total,
        isPassed,
        passMark: PASS_MARK,
        certificateUrl,
        message: isPassed
          ? `🎉 Congratulations! You scored ${score}% and passed. Your certificate has been emailed.`
          : `You scored ${score}%. You need ${PASS_MARK}% to pass. Please speak to your mentor.`,
      },
    });

  } catch (err) {
    console.error('[submitExam]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. Get Certificate ────────────────────────────────────────────────────────

/**
 * GET /api/v1/ilm/exam/certificate
 * Returns the intern's certificate URL if generated.
 */
exports.getCertificate = async (req, res) => {
  try {
    const internship = await Internship.findOne({
      intern: req.user._id,
      'certificate.isGenerated': true,
    });

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Certificate not yet generated' });
    }

    return res.json({
      success: true,
      data: {
        certificateId:  internship.certificate.certificateId,
        certificateUrl: internship.certificate.certificateUrl,
        issuedAt:       internship.certificate.issuedAt,
        linkedinShared: internship.certificate.linkedinShared,
      },
    });
  } catch (err) {
    console.error('[getCertificate]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
