const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');
const Internship = require('../models/Internship');

/**
 * Generates a verified PDF certificate and uploads to Cloudinary.
 * Returns the Cloudinary URL and the unique certificate ID.
 */
const generateCertificate = async (internshipId) => {
  const internship = await Internship.findById(internshipId)
    .populate('intern', 'profile.firstName profile.lastName email')
    .populate('company', 'name');

  if (!internship) throw new Error('Internship not found');
  if (!internship.exam?.isPassed) throw new Error('Exam not passed');

  const year = new Date().getFullYear();
  const seq = internshipId.toString().slice(-5).toUpperCase();
  const certificateId = `HSTORM-${year}-${seq}`;

  const verifyUrl = `${process.env.CLIENT_URL}/verify/${certificateId}`;
  const internName = `${internship.intern.profile.firstName} ${internship.intern.profile.lastName}`;
  const companyName = internship.company?.name || 'HireStorm';

  // Build PDF in memory
  const pdfBuffer = await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');

    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
      .lineWidth(3).stroke('#3b82f6');

    // Header
    doc.fillColor('#3b82f6').fontSize(36).font('Helvetica-Bold')
      .text('HireStorm', 0, 60, { align: 'center' });

    doc.fillColor('#94a3b8').fontSize(14).font('Helvetica')
      .text('CERTIFICATE OF COMPLETION', 0, 110, { align: 'center' });

    doc.moveDown(1);

    // Body
    doc.fillColor('#e2e8f0').fontSize(18).font('Helvetica')
      .text('This is to certify that', 0, 170, { align: 'center' });

    doc.fillColor('#ffffff').fontSize(32).font('Helvetica-Bold')
      .text(internName, 0, 200, { align: 'center' });

    doc.fillColor('#e2e8f0').fontSize(16).font('Helvetica')
      .text(`has successfully completed the 90-Day Internship Program at`, 0, 250, { align: 'center' });

    doc.fillColor('#3b82f6').fontSize(22).font('Helvetica-Bold')
      .text(companyName, 0, 280, { align: 'center' });

    doc.fillColor('#94a3b8').fontSize(12).font('Helvetica')
      .text(`From ${internship.startDate?.toDateString()} to ${internship.endDate?.toDateString()}`, 0, 320, { align: 'center' });

    // Certificate ID & Verify
    doc.fillColor('#64748b').fontSize(10)
      .text(`Certificate ID: ${certificateId}`, 60, 390)
      .text(`Verify at: ${verifyUrl}`, 60, 405);

    // Signature line
    doc.fillColor('#94a3b8').fontSize(11)
      .text('_________________________', 500, 380)
      .text('Platform Authority', 510, 400)
      .text('HireStorm', 525, 415);

    doc.end();
  });

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'hirestorm/certificates', public_id: certificateId, resource_type: 'raw', format: 'pdf' },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    Readable.from(pdfBuffer).pipe(uploadStream);
  });

  // Persist to DB
  internship.certificate = {
    isGenerated: true,
    certificateId,
    certificateUrl: uploadResult.secure_url,
    issuedAt: new Date(),
    linkedinShared: false,
  };
  internship.status = 'COMPLETED';
  await internship.save();

  return { certificateId, certificateUrl: uploadResult.secure_url };
};

module.exports = { generateCertificate };
