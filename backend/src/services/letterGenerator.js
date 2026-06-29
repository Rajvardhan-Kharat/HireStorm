/**
 * letterGenerator.js
 * Generates official Erfinden Technologies Pvt. Ltd. letterhead PDFs:
 *   - Internship Offer Letter
 *   - Internship Completion Certificate
 *
 * Layout matches the official Erfinden / InnoByes letterhead exactly.
 */

const PDFDocument = require('pdfkit');
const path        = require('path');
const fs          = require('fs');

// ── Asset paths ────────────────────────────────────────────────────────────────
const ASSETS    = path.join(__dirname, '../assets');
const LOGO_L    = path.join(ASSETS, 'erfinden_logo.png');
const LOGO_R    = path.join(ASSETS, 'innobytes_logo.png');
const SIGNATURE = path.join(ASSETS, 'sachin_signature.png');

// ── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtDate(date) {
  const d = new Date(date);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${ordinal(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Shared letterhead (header + footer on every page) ─────────────────────────
function drawLetterhead(doc) {
  const W = doc.page.width;   // 595 (A4)
  const H = doc.page.height;  // 841 (A4)
  const L = 55;

  // Left logo — Erfinden purple circle
  if (fs.existsSync(LOGO_L)) {
    doc.image(LOGO_L, L, 28, { width: 78, height: 78 });
  }

  // Right logo — InnoByes brain
  if (fs.existsSync(LOGO_R)) {
    doc.image(LOGO_R, W - 140, 26, { width: 90, height: 90 });
  }

  // Thin horizontal rule under logos
  doc.moveTo(L, 122)
     .lineTo(W - L, 122)
     .lineWidth(0.6)
     .strokeColor('#c0c0c0')
     .stroke();

  // ── Footer ──────────────────────────────────────────────────────────────────
  const fy = H - 70;
  doc.moveTo(L, fy)
     .lineTo(W - L, fy)
     .lineWidth(0.6)
     .strokeColor('#c0c0c0')
     .stroke();

  doc.fontSize(9)
     .font('Helvetica-Bold')
     .fillColor('#1a6fa8')
     .text('Erfinden Technologies Pvt. Ltd.', L, fy + 8, { align: 'center', width: W - L * 2 });

  doc.fontSize(7.8)
     .font('Helvetica')
     .fillColor('#1a6fa8')
     .text(
       'Row House No. C-101, SwapnaShilp, Five Gardens Soc., Near Jagtap Dairy, Near Balaji Tyres',
       L, fy + 22, { align: 'center', width: W - L * 2 }
     )
     .text(
       'Maharashtra, Pune - 411033  India  |  Email: info@innobytes.in',
       L, fy + 33, { align: 'center', width: W - L * 2 }
     );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFER LETTER
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generates the internship offer letter PDF buffer.
 *
 * @param {object} opts
 * @param {string}      opts.firstName   e.g. "Rajvardhan"
 * @param {string}      opts.lastName    e.g. "Kharat"
 * @param {Date|string} opts.startDate
 * @param {Date|string} opts.endDate
 * @param {string}      opts.role        e.g. "Developer – Intern"
 * @param {number|null} opts.stipend     Monthly stipend; 0 / null = Unpaid
 * @returns {Promise<Buffer>}
 */
async function generateOfferLetterPDF({ firstName, lastName, startDate, endDate, role, stipend }) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const chunks = [];
    doc.on('data',  c  => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W  = doc.page.width;   // 595
    const L  = 55;               // left margin
    const TW = W - L * 2;       // usable text width

    const fullName = `${firstName} ${lastName}`;
    const startFmt = fmtDate(startDate);
    const endFmt   = fmtDate(endDate);
    const isPaid   = stipend && Number(stipend) > 0;
    const stipText = isPaid ? `Rs. ${Number(stipend).toLocaleString('en-IN')}/month` : 'unpaid';
    const today    = fmtDate(new Date());

    // ── Letterhead ──────────────────────────────────────────────────────────
    drawLetterhead(doc);

    // ── Date ────────────────────────────────────────────────────────────────
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#000000')
       .text(`Date: ${today}`, L, 138);

    // ── Title: INTERNSHIP OFFER (centred, bold, underlined) ─────────────────
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('INTERNSHIP OFFER', L, doc.y + 20, {
         align: 'center', width: TW, underline: true,
       });

    // ── Paragraph 1 ─────────────────────────────────────────────────────────
    const gap = 18;
    doc.moveDown(0.5);
    const p1y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('We are glad to offer ', L, p1y, { continued: true, lineGap: 2 });
    doc.font('Helvetica-Bold').text(fullName, { continued: true });
    doc.font('Helvetica').text(` for ${isPaid ? 'a Paid' : 'an Unpaid'} Internship from `, { continued: true });
    doc.font('Helvetica-Bold').text(startFmt, { continued: true });
    doc.font('Helvetica').text(' to ', { continued: true });
    doc.font('Helvetica-Bold').text(`${endFmt}.`);

    // ── Paragraph 2 ─────────────────────────────────────────────────────────
    const p2y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('At the time of Internship he will be designated as ', L, p2y, { continued: true, lineGap: 2 });
    doc.font('Helvetica-Bold').text(`${role || 'Developer – Intern'}`, { continued: true });
    doc.font('Helvetica').text(` (${stipText}).`);

    // ── Paragraph 3 ─────────────────────────────────────────────────────────
    const p3y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text(firstName, L, p3y, { continued: true, lineGap: 2 });
    doc.font('Helvetica')
       .text(' would Work From Office/ Home and need to report their daily progress via email & video conference.');

    // ── Paragraph 4 ─────────────────────────────────────────────────────────
    const p4y = doc.y + 10;
    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000');
    doc.text(firstName, L, p4y, { continued: true, lineGap: 2 });
    doc.font('Helvetica')
       .text(' needs to visit Pune Office for Project Review , Mentorship and Guidance at least twice in a week .');

    // ── Signature block ──────────────────────────────────────────────────────
    const sigY = doc.y + 44;

    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('For ', L, sigY, { continued: true });
    doc.font('Helvetica-Bold').text('Erfinden Technologies Pvt. Ltd.');

    doc.fontSize(10.5).font('Helvetica').fillColor('#000000')
       .text('Sachin Deshpande', L, doc.y + 10);

    if (fs.existsSync(SIGNATURE)) {
      doc.image(SIGNATURE, L - 2, doc.y + 5, { width: 115, height: 58 });
      doc.y += 68; // move cursor past the image
    } else {
      doc.moveDown(2.5);
    }

    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000')
       .text('Founder and CEO', L, doc.y + 6);

    doc.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETION CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generates the internship completion certificate PDF buffer.
 *
 * @param {object} opts
 * @param {string}      opts.firstName
 * @param {string}      opts.lastName
 * @param {Date|string} opts.startDate
 * @param {Date|string} opts.endDate
 * @param {string}      opts.role
 * @param {string}      opts.certificateId   e.g. "HSTORM-2026-AB12C"
 * @param {number}      opts.examScore       0–100
 * @param {string}      opts.verifyUrl       Public verification URL
 * @returns {Promise<Buffer>}
 */
async function generateCompletionCertificatePDF({
  firstName, lastName, startDate, endDate, role,
  certificateId, examScore, verifyUrl,
}) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    const chunks = [];
    doc.on('data',  c  => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W  = doc.page.width;
    const L  = 55;
    const TW = W - L * 2;

    const fullName  = `${firstName} ${lastName}`;
    const startFmt  = fmtDate(startDate);
    const endFmt    = fmtDate(endDate);
    const today     = fmtDate(new Date());

    // ── Letterhead ──────────────────────────────────────────────────────────
    drawLetterhead(doc);

    // ── Date ────────────────────────────────────────────────────────────────
    doc.fontSize(10).font('Helvetica').fillColor('#000000')
       .text(`Date: ${today}`, L, 138);

    // ── Ref ─────────────────────────────────────────────────────────────────
    doc.fontSize(9.5).font('Helvetica').fillColor('#555555')
       .text(`Ref No: ${certificateId}`, L, 138, { align: 'right', width: TW });

    // ── Title ────────────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000')
       .text('INTERNSHIP COMPLETION CERTIFICATE', L, doc.y + 18, {
         align: 'center', width: TW, underline: true,
       });

    // ── Body ─────────────────────────────────────────────────────────────────
    const gap = 18;

    const p1y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('This is to certify that ', L, p1y, { continued: true, lineGap: 2 });
    doc.font('Helvetica-Bold').text(fullName, { continued: true });
    const durationStr = opts.durationDays ? `${opts.durationDays}-Day` : '90-Day';
    doc.font('Helvetica')
       .text(` has successfully completed the ${durationStr} Internship Program at Erfinden Technologies Pvt. Ltd. from `
             + `${startFmt} to ${endFmt}.`);

    const p2y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('During the internship, ', L, p2y, { continued: true, lineGap: 2 });
    doc.font('Helvetica-Bold').text(firstName, { continued: true });
    doc.font('Helvetica').text(' was designated as ', { continued: true });
    doc.font('Helvetica-Bold').text(role || 'Developer – Intern', { continued: true });
    doc.font('Helvetica')
       .text(' and demonstrated commendable dedication, technical skills, and professional conduct throughout the program.');

    const p3y = doc.y + gap;
    doc.fontSize(10.5).font('Helvetica').fillColor('#000000')
       .text('We wish ', L, p3y, { continued: true, lineGap: 2 });
    doc.font('Helvetica-Bold').text(firstName, { continued: true });
    doc.font('Helvetica')
       .text(' continued success in their future endeavours and highly recommend them for their hard work and commitment.');

    if (examScore !== undefined && examScore !== null) {
      doc.fontSize(9.5).font('Helvetica').fillColor('#555555')
         .text(`Final Assessment Score: ${examScore}/100`, L, doc.y + 14, { align: 'right', width: TW });
    }

    // ── Signature block ──────────────────────────────────────────────────────
    const sigY = doc.y + 44;

    doc.fontSize(10.5).font('Helvetica').fillColor('#000000');
    doc.text('For ', L, sigY, { continued: true });
    doc.font('Helvetica-Bold').text('Erfinden Technologies Pvt. Ltd.');

    doc.fontSize(10.5).font('Helvetica').fillColor('#000000')
       .text('Sachin Deshpande', L, doc.y + 10);

    if (fs.existsSync(SIGNATURE)) {
      doc.image(SIGNATURE, L - 2, doc.y + 5, { width: 115, height: 58 });
      doc.y += 68;
    } else {
      doc.moveDown(2.5);
    }

    doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#000000')
       .text('Founder and CEO', L, doc.y + 6);

    // ── Verify URL ───────────────────────────────────────────────────────────
    if (verifyUrl) {
      doc.fontSize(8.5).font('Helvetica').fillColor('#888888')
         .text(`Verify this certificate at: ${verifyUrl}`, L, doc.y + 20, {
           align: 'center', width: TW,
         });
    }

    doc.end();
  });
}

module.exports = { generateOfferLetterPDF, generateCompletionCertificatePDF, fmtDate };
