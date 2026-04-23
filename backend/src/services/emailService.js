const nodemailer = require('nodemailer');

/* ─── Transporter ──────────────────────────────────────────────────────── */
const config = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
};
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  config.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
}
const transporter = nodemailer.createTransport(config);

/* ─── Base send function ────────────────────────────────────────────────── */
const sendEmail = async (to, subject, text, html) => {
  // In dev without credentials: just log
  if (!process.env.SMTP_USER && process.env.NODE_ENV !== 'production') {
    console.log(`\n[EmailService Mock]\n  To: ${to}\n  Subject: ${subject}\n  Body: ${text}\n`);
    return { messageId: 'mock-dev' };
  }
  const info = await transporter.sendMail({
    from: `"Innobytes" <${process.env.SMTP_USER || 'noreply@innobytes.io'}>`,
    to, subject, text, html,
  });
  console.log(`[EmailService] Sent → ${to} | ${subject}`);
  return info;
};
exports.sendEmail = sendEmail;

/* ─── Hackathon Pipeline Templates ─────────────────────────────────────── */

/** Email all leaders when hackathon is started */
exports.sendBulkHackathonStarted = async (leaders, hackTitle, phase1Deadline, phase2Deadline) => {
  const d1 = new Date(phase1Deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const d2 = new Date(phase2Deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return Promise.allSettled(
    leaders.map(({ email, firstName }) =>
      sendEmail(
        email,
        `🔥 ${hackTitle} — Hackathon Has Begun!`,
        `Hi ${firstName}, the hackathon has started!`,
        `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
          <h1 style="color:#4f7ef8">🔥 ${hackTitle} Has Begun!</h1>
          <p>Hi <strong>${firstName}</strong>, the hackathon has officially started. Your team is registered — let's build!</p>
          <h3 style="color:#a78bfa">⏰ Key Deadlines</h3>
          <ul>
            <li><strong>Phase 1 — Ideation Submission:</strong> ${d1} (24 hours)</li>
            <li><strong>Phase 2 — Final Build Submission:</strong> ${d2} (another 24 hours)</li>
          </ul>
          <p>Submit your PPT, video walkthrough, and proposed solution through the platform before the Phase 1 deadline.</p>
          <p>Only the <strong>Group Leader</strong> can submit on behalf of the team.</p>
          <p style="color:#8a9ac0">Best of luck! — Team Innobytes</p>
        </div>`
      )
    )
  );
};

/** Phase 1 shortlisted */
exports.sendPhase1Shortlisted = async (toEmail, teamName, phase2Deadline) => {
  const d = new Date(phase2Deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return sendEmail(
    toEmail,
    '🎉 Congratulations! Your Team Advanced to Phase 2',
    `Team ${teamName} has been shortlisted!`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#34d399">🎉 Shortlisted for Phase 2!</h1>
      <p>Congratulations! Your team <strong>${teamName}</strong> has been selected by our review committee.</p>
      <h3 style="color:#a78bfa">What's Next — Phase 2 (Build)</h3>
      <p>You now have <strong>24 hours</strong> to build your actual solution.</p>
      <ul>
        <li>Submit your <strong>GitHub Repository</strong></li>
        <li>Submit a final <strong>demo video</strong></li>
        <li>Submit your final <strong>presentation (PPT)</strong></li>
      </ul>
      <p><strong>Phase 2 Deadline: ${d}</strong></p>
      <p>After Phase 2, shortlisted teams will be scheduled for a <strong>Google Meet interview</strong>.</p>
      <p style="color:#8a9ac0">Keep building! — Team Innobytes</p>
    </div>`
  );
};

/** Phase 1 rejected */
exports.sendPhase1Rejection = async (toEmail, teamName) => {
  return sendEmail(
    toEmail,
    'Hackathon Phase 1 Results — Thank You for Participating',
    `Thank you for participating, ${teamName}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#f87171">Hackathon Phase 1 Results</h1>
      <p>Hi Team <strong>${teamName}</strong>,</p>
      <p>Thank you for your participation and effort. After careful review, we were unable to advance your team to Phase 2 at this time.</p>
      <p>We truly appreciated your ideas and encourage you to keep building. We hope to see you again in our next hackathon!</p>
      <p style="color:#8a9ac0">With appreciation — Team Innobytes</p>
    </div>`
  );
};

/** Interview invite with Google Meet link */
exports.sendInterviewInvite = async (toEmail, teamName, meetLink, startTime) => {
  const timeStr = new Date(startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  return sendEmail(
    toEmail,
    `📅 Interview Scheduled — Team ${teamName}`,
    `Your interview is at ${timeStr}. Google Meet: ${meetLink}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#4f7ef8">📅 Interview Scheduled!</h1>
      <p>Congratulations Team <strong>${teamName}</strong>! You've been selected for the final interview round.</p>
      <h3 style="color:#a78bfa">Interview Details</h3>
      <p><strong>Date & Time:</strong> ${timeStr} (IST)</p>
      <p><strong>Platform:</strong> Google Meet</p>
      <p><a href="${meetLink}" style="display:inline-block;padding:12px 24px;background:#4f7ef8;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">🎥 Join Google Meet</a></p>
      <p style="margin-top:16px">Please be ready to demonstrate your Phase 2 submission and answer technical questions.</p>
      <p style="color:#8a9ac0">Best of luck! — Team Innobytes</p>
    </div>`
  );
};

/** Internship offer to a winning team member */
exports.sendInternshipOffer = async (toEmail, studentName, teamName, pdfUrl, acceptUrl, rejectUrl) => {
  return sendEmail(
    toEmail,
    `🎊 Internship Offer — Innobytes (90-Day Program)`,
    `Congratulations ${studentName}! You have been offered a 3-month internship at Innobytes.`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#34d399">🎊 Congratulations, ${studentName}!</h1>
      <p>We are thrilled to offer you a <strong>90-Day Internship</strong> at <strong>Innobytes</strong>, as part of Team <strong>${teamName}</strong>'s winning performance in our hackathon.</p>
      <h3 style="color:#a78bfa">Your Offer Letter</h3>
      <p><a href="${pdfUrl}" style="color:#4f7ef8">📄 Download Offer Letter PDF</a></p>
      <h3 style="color:#a78bfa">Please Respond</h3>
      <p>Kindly accept or reject this offer using the links below:</p>
      <div style="margin-top:16px;display:flex;gap:12px">
        <a href="${acceptUrl}" style="display:inline-block;padding:12px 28px;background:#34d399;color:#0a1520;border-radius:8px;text-decoration:none;font-weight:bold;margin-right:12px">✅ Accept Offer</a>
        <a href="${rejectUrl}" style="display:inline-block;padding:12px 28px;background:#f87171;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">❌ Decline</a>
      </div>
      <p style="margin-top:20px;color:#8a9ac0">You can also respond through the platform notification. — Team Innobytes</p>
    </div>`
  );
};

/** Sent after accepted — welcome onboarding */
exports.sendOfferAcceptedConfirmation = async (toEmail, studentName) => {
  return sendEmail(
    toEmail,
    '🚀 Welcome to Innobytes — Internship Confirmed!',
    `Welcome aboard, ${studentName}!`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#4f7ef8">🚀 Welcome to Innobytes, ${studentName}!</h1>
      <p>Your internship offer has been confirmed. We're excited to have you on board for the 90-Day Innobytes Internship Program.</p>
      <h3 style="color:#a78bfa">What Happens Next</h3>
      <ul>
        <li>Your mentor will be assigned within 24 hours</li>
        <li>Log in to the platform to see your Work Breakdown Structure (WBS)</li>
        <li>Submit daily logs every working day (Mon–Fri, excluding national holidays)</li>
        <li>Monthly review sessions will be conducted by your mentor</li>
      </ul>
      <p style="color:#8a9ac0">Looking forward to working with you! — Team Innobytes</p>
    </div>`
  );
};

/** Certificate email */
exports.sendCertificateEmail = async (toEmail, studentName, certUrl) => {
  return sendEmail(
    toEmail,
    '🏆 Your Innobytes Certificate of Completion is Ready!',
    `Congratulations ${studentName}! Your certificate is ready.`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#fbbf24">🏆 Certificate of Completion</h1>
      <p>Congratulations <strong>${studentName}</strong>! You have successfully completed the 90-Day Innobytes Internship Program and passed the final assessment.</p>
      <p><a href="${certUrl}" style="display:inline-block;padding:12px 28px;background:#fbbf24;color:#0a1520;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">📜 Download Certificate</a></p>
      <p style="margin-top:16px">Share your achievement on LinkedIn and let the world know about your accomplishment!</p>
      <p style="color:#8a9ac0">Congratulations once again! — Team Innobytes</p>
    </div>`
  );
};

/** Team invite */
exports.sendTeamInvite = async (toEmail, teamName, inviteUrl) => {
  return sendEmail(
    toEmail,
    `📨 Team Invitation — ${teamName}`,
    `You've been invited to join team ${teamName}. Accept: ${inviteUrl}`,
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f1623;color:#e8edf8;border-radius:12px">
      <h1 style="color:#a78bfa">📨 Team Invitation</h1>
      <p>You've been invited to join team <strong>${teamName}</strong> for a hackathon on the Innobytes platform.</p>
      <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4f7ef8;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">Accept Invitation</a></p>
      <p style="margin-top:16px;color:#8a9ac0">If you didn't expect this, you can ignore this email.</p>
    </div>`
  );
};

/** Legacy compat */
exports.sendOfferMagicLink = exports.sendInternshipOffer;
