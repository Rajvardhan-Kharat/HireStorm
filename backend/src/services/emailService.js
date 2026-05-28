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

/* ─── Campus Drive Pipeline Templates ──────────────────────────────────────── */

/** Send AI Skills Test link to shortlisted student */
exports.sendAITestInvite = async (toEmail, studentName, role, testUrl, driveTitle) => {
  return sendEmail(
    toEmail,
    `🧠 AI Skills Assessment — ${driveTitle}`,
    `Hi ${studentName}, complete your AI skills test for the ${role} role.`,
    `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">🧠</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">AI Skills Assessment</h1>
        <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">${driveTitle}</p>
      </div>
      <div style="padding:36px 40px">
        <p style="color:#1e293b;font-size:16px">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.7">Congratulations on being shortlisted for <strong>${role}</strong>! Complete the AI Skills Assessment to proceed.</p>
        <div style="background:#f0f4ff;border-left:4px solid #4f46e5;border-radius:8px;padding:16px 20px;margin:24px 0">
          <p style="color:#4f46e5;font-weight:700;margin:0 0 8px;font-size:13px">📋 ASSESSMENT DETAILS</p>
          <p style="color:#334155;margin:4px 0;font-size:13px">• 10 multiple-choice questions (role-relevant)</p>
          <p style="color:#334155;margin:4px 0;font-size:13px">• Time limit: 20 minutes</p>
          <p style="color:#334155;margin:4px 0;font-size:13px">• Passing score: 60%+</p>
          <p style="color:#334155;margin:4px 0;font-size:13px">• Link valid for 48 hours</p>
        </div>
        <div style="text-align:center;margin:32px 0">
          <a href="${testUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px">🚀 Start My Assessment</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center">Or copy: <span style="color:#4f46e5">${testUrl}</span></p>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px;margin:0">⚡ HireStorm — Campus Placement Division</p>
      </div>
    </div>`
  );
};

/** Interview invite with Google Meet link */
exports.sendCampusInterviewInvite = async (toEmail, studentName, role, meetLink, scheduledAt, driveTitle) => {
  const timeStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })
    : 'To be communicated';
  return sendEmail(
    toEmail,
    `📅 Interview Scheduled — ${role} | ${driveTitle}`,
    `Hi ${studentName}, your interview is scheduled. Join: ${meetLink}`,
    `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#0ea5e9,#4f46e5);padding:32px 40px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">📅</div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Interview Scheduled!</h1>
        <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">${driveTitle}</p>
      </div>
      <div style="padding:36px 40px">
        <p style="color:#1e293b;font-size:16px">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.7">You passed the AI Skills Assessment! You've been selected for a <strong>final interview</strong> for <strong>${role}</strong>.</p>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;margin:24px 0">
          <p style="color:#0369a1;font-weight:700;margin:0 0 12px;font-size:13px">🎯 INTERVIEW DETAILS</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="color:#64748b;font-size:13px;padding:5px 0;width:140px">📅 Date &amp; Time</td><td style="color:#0f172a;font-size:13px;font-weight:600">${timeStr} (IST)</td></tr>
            <tr><td style="color:#64748b;font-size:13px;padding:5px 0">💼 Role</td><td style="color:#0f172a;font-size:13px;font-weight:600">${role}</td></tr>
            <tr><td style="color:#64748b;font-size:13px;padding:5px 0">🖥️ Platform</td><td style="color:#0f172a;font-size:13px;font-weight:600">Google Meet</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:28px 0">
          <a href="${meetLink}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px">🎥 Join Google Meet</a>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;font-size:13px;color:#92400e">
          💡 <strong>Tips:</strong> Test camera &amp; mic beforehand. Be ready to discuss your projects and answer technical questions.
        </div>
      </div>
      <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px;margin:0">⚡ HireStorm — Campus Placement Division</p>
      </div>
    </div>`
  );
};

/** Campus Drive offer letter — HTML email with optional PDF attachment */
exports.sendCampusOfferLetter = async (toEmail, studentName, role, collegeName, startDate, endDate, stipend, acceptUrl, rejectUrl, driveTitle, pdfBuffer) => {
  const start = startDate ? new Date(startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'As communicated';
  const end   = endDate   ? new Date(endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'As communicated';
  const stip  = stipend   ? `&#8377;${Number(stipend).toLocaleString('en-IN')}/month` : 'As discussed';
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = [
    ['Role / Position', role || 'Intern'],
    ['College', collegeName || '—'],
    ['Start Date', start],
    ['End Date', end],
    ['Stipend', stip],
    ['Type', 'Internship (Full-Time)'],
  ];

  // Build nodemailer options (with optional PDF attachment)
  const mailOpts = {
    from: `"Innobytes" <${process.env.SMTP_USER || 'noreply@innobytes.io'}>`,
    to: toEmail,
    subject: `🎊 Internship Offer Letter — ${role} | ${driveTitle}`,
    text: `Congratulations ${studentName}! You have been selected for ${role}. Please accept or decline within 72 hours.`,
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12)">
      <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 48px 28px">
        <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px">&#9889; HireStorm</div>
        <div style="color:rgba(255,255,255,.7);font-size:12px;margin-top:2px">Campus Placement Division</div>
        <div style="margin-top:20px;background:rgba(255,255,255,.15);border-radius:10px;padding:14px 20px;text-align:center">
          <div style="color:#fff;font-size:17px;font-weight:700;letter-spacing:1px">INTERNSHIP OFFER LETTER</div>
          <div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:4px">Date: ${today}</div>
        </div>
      </div>
      <div style="padding:40px 48px">
        <p style="color:#1e293b;font-size:16px;margin:0 0 16px">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.8;margin:0 0 28px">We are delighted to offer you the position of <strong style="color:#4f46e5">${role}</strong> through the campus placement drive at <strong>${collegeName}</strong>. After evaluating your profile, AI assessment results, and review, we are confident you will be a great addition to our team.</p>
        <div style="background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;overflow:hidden;margin-bottom:28px">
          <div style="background:#4f46e5;padding:12px 20px">
            <span style="color:#fff;font-weight:700;font-size:13px;letter-spacing:.5px">📋 OFFER DETAILS</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            ${rows.map(([k, v], i) => `<tr style="background:${i % 2 === 0 ? '#f8faff' : '#fff'}"><td style="padding:11px 20px;color:#64748b;font-size:13px;font-weight:600;width:170px;border-bottom:1px solid #e0e7ff">${k}</td><td style="padding:11px 20px;color:#0f172a;font-size:13px;border-bottom:1px solid #e0e7ff">${v}</td></tr>`).join('')}
          </table>
        </div>
        <div style="margin-bottom:28px">
          <p style="color:#0f172a;font-weight:700;font-size:14px;margin:0 0 10px">📜 Terms &amp; Conditions</p>
          <ol style="color:#475569;font-size:13px;line-height:2;padding-left:20px;margin:0">
            <li>This offer is subject to successful background verification.</li>
            <li>The intern must report on time and maintain professional conduct.</li>
            <li>All work produced during the internship is the property of the organization.</li>
            <li>Stipend is paid monthly against daily log submissions.</li>
            <li>Either party may terminate with 7 days' written notice.</li>
          </ol>
        </div>
        ${pdfBuffer ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#166534">
          📎 <strong>Your Offer Letter PDF</strong> is attached to this email. Please download and save it for your records.
        </div>` : ''}
        <p style="color:#475569;font-size:13px;margin:0 0 20px">This offer is valid for <strong>72 hours</strong>. Please respond:</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${acceptUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;margin-right:12px">&#10003; Accept Offer</a>
          <a href="${rejectUrl}" style="display:inline-block;background:#f1f5f9;color:#64748b;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;border:1px solid #e2e8f0">&#10007; Decline</a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:8px">You can also respond through your HireStorm dashboard.</p>
      </div>
      <div style="background:#1e1b4b;padding:20px 48px;text-align:center">
        <p style="color:rgba(255,255,255,.6);font-size:12px;margin:0">&#9889; HireStorm — Connecting Campuses with Opportunity</p>
      </div>
    </div>`,
  };

  // Attach PDF if buffer provided
  if (pdfBuffer) {
    mailOpts.attachments = [{
      filename: `Offer_Letter_${studentName.replace(/\s+/g, '_')}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    }];
  }

  // In dev without credentials: just log
  if (!process.env.SMTP_USER && process.env.NODE_ENV !== 'production') {
    console.log(`\n[EmailService Mock — Offer Letter]\n  To: ${toEmail}\n  Subject: ${mailOpts.subject}\n  PDF attached: ${!!pdfBuffer}\n`);
    return { messageId: 'mock-dev' };
  }

  const info = await transporter.sendMail(mailOpts);
  console.log(`[EmailService] Offer letter sent → ${toEmail} | PDF: ${!!pdfBuffer}`);
  return info;
};

/** AI test failed notification */
exports.sendAITestFailed = async (toEmail, studentName, role, score, driveTitle) => {
  return sendEmail(
    toEmail,
    `📊 Assessment Result — ${driveTitle}`,
    `Hi ${studentName}, your AI skills assessment result is ready.`,
    `<div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#dc2626,#9f1239);padding:32px 40px;text-align:center">
        <div style="font-size:32px">📊</div>
        <h1 style="color:#fff;margin:8px 0 0;font-size:20px">Assessment Results</h1>
      </div>
      <div style="padding:36px 40px">
        <p style="color:#1e293b;font-size:15px">Hi <strong>${studentName}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.7">Thank you for completing the AI Skills Assessment for <strong>${role}</strong> in <strong>${driveTitle}</strong>.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:20px;text-align:center;margin:24px 0">
          <div style="font-size:36px;font-weight:800;color:#dc2626">${score}%</div>
          <div style="color:#991b1b;font-size:14px;margin-top:4px">Score (Passing: 60%)</div>
        </div>
        <p style="color:#475569;font-size:14px;line-height:1.7">Unfortunately the score did not meet the minimum threshold. Keep developing your skills and we hope to see you in future drives!</p>
        <p style="color:#94a3b8;font-size:13px;text-align:center;margin-top:28px">— Team HireStorm</p>
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:12px;margin:0">&#9889; HireStorm — Campus Placement Division</p>
      </div>
    </div>`
  );
};
