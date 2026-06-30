const PDFDocument = require('pdfkit');
const { Readable } = require('stream');
const { cloudinary } = require('../config/cloudinary');

const fs = require('fs');
const path = require('path');

// ─── Upload buffer to Cloudinary (with local fallback) ───────────────────────
const uploadBufferToCloudinary = (buffer, public_id) => {
  return new Promise((resolve, reject) => {
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    const fallbackToLocal = () => {
      try {
        const uploadDir = path.join(__dirname, '../../public/uploads/hirestorm');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${public_id || Date.now()}.pdf`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        
        const serverUrl = process.env.API_URL || 'http://localhost:5000';
        console.warn(`[Upload Fallback] Saved PDF locally to ${filePath}`);
        resolve({ secure_url: `${serverUrl}/uploads/hirestorm/${filename}` });
      } catch (localErr) {
        reject(localErr);
      }
    };

    if (!isCloudinaryConfigured) {
      console.warn('[Upload Fallback] Cloudinary not configured. Falling back to local disk.');
      return fallbackToLocal();
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hirestorm', resource_type: 'raw', format: 'pdf', public_id },
      (err, result) => {
        if (err) {
          console.warn(`[Upload Fallback] Cloudinary upload failed: ${err.message}. Falling back to local disk.`);
          return fallbackToLocal();
        }
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ─── Build Campus Offer Letter PDF (shared builder) ───────────────────────────
function buildCampusOfferLetterDoc(doc, { studentName, role, collegeName, startDate, endDate, stipend, template }) {
  const W = doc.page.width - 120;
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Template fields with defaults
  const companyName   = template?.companyName   || 'HireStorm / Innobytes';
  const signatoryName = template?.signatoryName || 'HR Team';
  const signatoryTitle= template?.signatoryTitle|| 'Campus Placement Division, HireStorm';
  const footerText    = template?.footerText    || 'HireStorm — Connecting Campuses with Opportunity  |  hirestorm.innobytes.io';

  const defaultTerms = [
    'This internship offer is subject to successful completion of background verification.',
    'The intern is expected to report punctually and maintain professional conduct throughout the duration.',
    'All work produced during the internship remains the intellectual property of the organization.',
    'The stipend will be disbursed monthly after the submission of the daily progress log.',
    'Either party may terminate this internship with a 7-day written notice.',
  ];
  const terms = (template?.customTerms && template.customTerms.length > 0)
    ? template.customTerms
    : defaultTerms;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 12).fill('#4f46e5');

  // ── Logo area ────────────────────────────────────────────────────────────────
  doc.moveDown(0.5);
  doc.fontSize(26).fillColor('#4f46e5').font('Helvetica-Bold')
    .text('⚡ HireStorm', 60, 30, { align: 'left' });
  doc.fontSize(9).fillColor('#64748b').font('Helvetica')
    .text('Campus Placement Division', 60, 58, { align: 'left' });

  // Right: date
  doc.fontSize(9).fillColor('#334155')
    .text(`Date: ${today}`, 0, 38, { align: 'right', width: doc.page.width - 60 });

  // Divider
  doc.moveTo(60, 80).lineTo(doc.page.width - 60, 80)
    .strokeColor('#4f46e5').lineWidth(1.5).stroke();

  // ── Title Block ──────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc.rect(60, 105, W, 52).fill('#f0f4ff').stroke();
  doc.fontSize(14).fillColor('#4f46e5').font('Helvetica-Bold')
    .text('INTERNSHIP OFFER LETTER', 60, 116, { align: 'center', width: W });
  doc.fontSize(10).fillColor('#475569').font('Helvetica')
    .text('Campus Placement Drive', 60, 134, { align: 'center', width: W });

  // ── Salutation ───────────────────────────────────────────────────────────────
  doc.moveDown(2.5);
  doc.fontSize(11).fillColor('#0f172a').font('Helvetica')
    .text(`Dear ${studentName},`, 60);

  doc.moveDown();
  doc.fontSize(10.5).fillColor('#1e293b').font('Helvetica')
    .text(
      `We are pleased to extend this formal offer of internship to you from ${companyName}, selected through the campus placement drive conducted at ${collegeName || 'your college'}. After a thorough evaluation — including your academic credentials, AI skills assessment, and application review — we believe you are an excellent fit for the role.`,
      60, undefined, { align: 'justify', lineGap: 3 }
    );

  // ── Offer Details Box ────────────────────────────────────────────────────────
  doc.moveDown(1.5);
  const boxY = doc.y;
  doc.rect(60, boxY, W, 148).fill('#f8fafc').strokeColor('#e2e8f0').lineWidth(1).stroke();

  doc.fontSize(11).fillColor('#4f46e5').font('Helvetica-Bold')
    .text('Offer Details', 76, boxY + 12);

  const detailY = boxY + 32;
  const col1 = 76, col2 = 260;
  const lineH = 22;

  const rows = [
    ['Role / Position', role || 'Software Developer Intern'],
    ['College', collegeName || '—'],
    ['Start Date', startDate ? new Date(startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'As communicated'],
    ['End Date', endDate ? new Date(endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'As communicated'],
    ['Stipend', stipend ? `Rs. ${Number(stipend).toLocaleString('en-IN')}/month` : 'As discussed'],
    ['Type', 'Internship (Full-Time)'],
  ];

  rows.forEach(([label, value], i) => {
    const y = detailY + i * lineH;
    doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold').text(label, col1, y);
    doc.fontSize(9.5).fillColor('#0f172a').font('Helvetica').text(value, col2, y);
  });

  // ── Terms ─────────────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text('Terms & Conditions');
  doc.moveDown(0.4);
  terms.forEach((t, i) => {
    doc.fontSize(9.5).fillColor('#334155').font('Helvetica')
      .text(`${i + 1}. ${t}`, 60, undefined, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.2);
  });

  // ── Acceptance ───────────────────────────────────────────────────────────────
  doc.moveDown();
  doc.fontSize(10.5).fillColor('#1e293b').font('Helvetica')
    .text('Please accept or decline this offer using the buttons in the email. This offer remains valid for 72 hours from the date of issuance.', 60, undefined, { align: 'justify', lineGap: 3 });

  // ── Signature Area ────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text(`For ${companyName}`);
  doc.moveDown(0.3);
  doc.moveTo(60, doc.y + 30).lineTo(200, doc.y + 30).strokeColor('#94a3b8').lineWidth(0.8).stroke();
  doc.moveDown(2.2);
  doc.fontSize(9).fillColor('#64748b').font('Helvetica').text(signatoryName);
  doc.fontSize(9).text(signatoryTitle);

  // ── Footer bar ────────────────────────────────────────────────────────────────
  doc.rect(0, doc.page.height - 28, doc.page.width, 28).fill('#4f46e5');
  doc.fontSize(8).fillColor('#ffffff').font('Helvetica')
    .text(footerText, 0, doc.page.height - 19, { align: 'center' });
}

// ─── Campus Drive Offer Letter — returns Buffer (for email attachment) ─────────
exports.generateCampusOfferLetterBuffer = ({ studentName, role, collegeName, startDate, endDate, stipend, template }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const buffers = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      buildCampusOfferLetterDoc(doc, { studentName, role, collegeName, startDate, endDate, stipend, template });
      doc.end();
    } catch (err) { reject(err); }
  });
};

// ─── Campus Drive Offer Letter — uploads to Cloudinary, returns URL ───────────
exports.generateCampusOfferLetterPDF = async ({ studentName, role, collegeName, companyName, startDate, endDate, stipend, uniqueId, template }) => {
  const tmpl = template || (companyName ? { companyName } : null);
  const buf = await exports.generateCampusOfferLetterBuffer({ studentName, role, collegeName, startDate, endDate, stipend, template: tmpl });
  const result = await uploadBufferToCloudinary(buf, `campus_offer_${uniqueId}`);
  return result.secure_url;
};

// ─── Hackathon Offer Letter (legacy) ─────────────────────────────────────────
exports.generateAndUploadOfferLetter = async (studentName, uniqueId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 60 });
      const buffers = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', async () => {
        try {
          const pdfData = Buffer.concat(buffers);
          const result = await uploadBufferToCloudinary(pdfData, `offer_${uniqueId}`);
          resolve(result.secure_url);
        } catch (e) { reject(e); }
      });

      const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
      const W = doc.page.width - 120;

      doc.rect(0, 0, doc.page.width, 12).fill('#4f46e5');
      doc.fontSize(26).fillColor('#4f46e5').font('Helvetica-Bold').text('⚡ HireStorm', 60, 30);
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('Hackathon Division', 60, 58);
      doc.fontSize(9).fillColor('#334155').text(`Date: ${today}`, 0, 38, { align: 'right', width: doc.page.width - 60 });
      doc.moveTo(60, 80).lineTo(doc.page.width - 60, 80).strokeColor('#4f46e5').lineWidth(1.5).stroke();

      doc.moveDown(2);
      doc.rect(60, 105, W, 52).fill('#f0f4ff').stroke();
      doc.fontSize(14).fillColor('#4f46e5').font('Helvetica-Bold').text('INTERNSHIP OFFER LETTER', 60, 116, { align: 'center', width: W });
      doc.fontSize(10).fillColor('#475569').font('Helvetica').text('Hackathon Winner — 90-Day Program', 60, 134, { align: 'center', width: W });

      doc.moveDown(2.5);
      doc.fontSize(11).fillColor('#0f172a').font('Helvetica').text(`Dear ${studentName},`);
      doc.moveDown();
      doc.fontSize(10.5).fillColor('#1e293b').font('Helvetica')
        .text('Congratulations! We are thrilled to formally offer you a 90-Day Internship at Innobytes, following your extraordinary performance in our recent Hackathon. Your talent and dedication stood out among all participants.', 60, undefined, { align: 'justify', lineGap: 3 });

      doc.moveDown();
      doc.fontSize(10.5).text('Please accept or reject this offer using the Magic Links sent in this email. This offer is valid for 72 hours.', 60, undefined, { align: 'justify', lineGap: 3 });

      doc.moveDown(3);
      doc.fontSize(10).fillColor('#0f172a').font('Helvetica-Bold').text('For Innobytes / HireStorm');
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y + 30).lineTo(200, doc.y + 30).strokeColor('#94a3b8').lineWidth(0.8).stroke();
      doc.moveDown(2.2);
      doc.fontSize(9).fillColor('#64748b').font('Helvetica').text('Authorised Signatory');

      doc.rect(0, doc.page.height - 28, doc.page.width, 28).fill('#4f46e5');
      doc.fontSize(8).fillColor('#ffffff').font('Helvetica')
        .text('HireStorm — Connecting Campuses with Opportunity  |  hirestorm.innobytes.io', 0, doc.page.height - 19, { align: 'center' });

      doc.end();
    } catch (err) { reject(err); }
  });
};

// ─── Certificate (legacy) ─────────────────────────────────────────────────────
exports.generateAndUploadCertificate = async (studentName, uniqueId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
      const buffers = [];
      doc.on('data', (b) => buffers.push(b));
      doc.on('end', async () => {
        try {
          const pdfData = Buffer.concat(buffers);
          const result = await uploadBufferToCloudinary(pdfData, `cert_${uniqueId}`);
          resolve(result.secure_url);
        } catch (e) { reject(e); }
      });

      const W = doc.page.width, H = doc.page.height;
      doc.rect(0, 0, W, H).fill('#f0f4ff');
      doc.rect(20, 20, W - 40, H - 40).strokeColor('#4f46e5').lineWidth(3).stroke();
      doc.rect(28, 28, W - 56, H - 56).strokeColor('#a78bfa').lineWidth(1).stroke();

      doc.fontSize(36).fillColor('#4f46e5').font('Helvetica-Bold').text('⚡ HireStorm', 0, 60, { align: 'center' });
      doc.fontSize(26).fillColor('#1e293b').font('Helvetica-Bold').text('Certificate of Completion', 0, 120, { align: 'center' });
      doc.moveTo(W * 0.2, 165).lineTo(W * 0.8, 165).strokeColor('#4f46e5').lineWidth(1.5).stroke();
      doc.moveDown(1.5);
      doc.fontSize(14).fillColor('#475569').font('Helvetica').text('This is to certify that', 0, 180, { align: 'center' });
      doc.fontSize(28).fillColor('#0f172a').font('Helvetica-Bold').text(studentName, 0, 210, { align: 'center' });
      doc.fontSize(13).fillColor('#475569').font('Helvetica')
        .text('has successfully completed the 90-Day Internship Program at Innobytes\nand demonstrated exemplary technical skills and professional conduct.', 0, 255, { align: 'center', lineGap: 4 });
      doc.fontSize(11).fillColor('#64748b').text(`Issued on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 0, 340, { align: 'center' });

      doc.end();
    } catch (err) { reject(err); }
  });
};
