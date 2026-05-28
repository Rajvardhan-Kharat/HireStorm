/**
 * certificateService.js
 * Generates the official Erfinden / InnoByes branded Completion Certificate
 * using the shared letterGenerator, uploads to Cloudinary, and persists to DB.
 */

const { v4: uuidv4 }        = require('uuid');
const { cloudinary }         = require('../config/cloudinary');
const { Readable }           = require('stream');
const Internship             = require('../models/Internship');
const { generateCompletionCertificatePDF } = require('./letterGenerator');

/**
 * Generates a verified PDF certificate and uploads to Cloudinary.
 * Returns the Cloudinary URL and the unique certificate ID.
 *
 * @param {string} internshipId  - MongoDB ObjectId of the Internship document
 * @returns {{ certificateId: string, certificateUrl: string }}
 */
const generateCertificate = async (internshipId) => {
  const internship = await Internship.findById(internshipId)
    .populate('intern',  'profile.firstName profile.lastName email')
    .populate('company', 'name');

  if (!internship)            throw new Error('Internship not found');
  if (!internship.exam?.isPassed) throw new Error('Exam not passed');

  // ── Certificate ID ──────────────────────────────────────────────────────────
  const year          = new Date().getFullYear();
  const seq           = internshipId.toString().slice(-5).toUpperCase();
  const certificateId = `HSTORM-${year}-${seq}`;
  const verifyUrl     = `${process.env.CLIENT_URL || 'https://hirestorm.onrender.com'}/verify/${certificateId}`;

  const internName = `${internship.intern.profile.firstName} ${internship.intern.profile.lastName}`;
  const [firstName, ...rest] = internName.split(' ');
  const lastName = rest.join(' ');

  // ── Build PDF ────────────────────────────────────────────────────────────────
  const pdfBuffer = await generateCompletionCertificatePDF({
    firstName,
    lastName,
    startDate:     internship.startDate,
    endDate:       internship.endDate,
    role:          internship.role || 'Developer – Intern',
    certificateId,
    examScore:     internship.exam?.score ?? null,
    verifyUrl,
  });

  // ── Upload to Cloudinary ─────────────────────────────────────────────────────
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hirestorm/certificates', public_id: certificateId, resource_type: 'raw', format: 'pdf' },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    Readable.from(pdfBuffer).pipe(stream);
  });

  // ── Persist to DB ────────────────────────────────────────────────────────────
  internship.certificate = {
    isGenerated:    true,
    certificateId,
    certificateUrl: uploadResult.secure_url,
    issuedAt:       new Date(),
    linkedinShared: false,
  };
  internship.status = 'COMPLETED';
  await internship.save();

  return { certificateId, certificateUrl: uploadResult.secure_url };
};

module.exports = { generateCertificate };
