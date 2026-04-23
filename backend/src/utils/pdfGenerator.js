const PDFDocument = require('pdfkit');
const { Readable } = require('stream');
const { cloudinary } = require('../config/cloudinary');

// Pure Javascript helper mapping a pdfkit pipeline completely directly to Cloudinary streams
const uploadBufferToCloudinary = (buffer, public_id) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hirestorm', resource_type: 'raw', format: 'pdf', public_id },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

exports.generateAndUploadOfferLetter = async (studentName, uniqueId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfData = Buffer.concat(buffers);
          const result = await uploadBufferToCloudinary(pdfData, `offer_${uniqueId}`);
          resolve(result.secure_url);
        } catch (e) {
          reject(e);
        }
      });

      doc.fontSize(24).text('InnoBytes', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('OFFER OF INTERNSHIP', { align: 'center', underline: true });
      doc.moveDown(2);
      doc.fontSize(12).text(`Dear ${studentName},`);
      doc.moveDown();
      doc.text(`We are thrilled to formally outline this 90-Day Internship following your extraordinary performance in our recent Hackathon.`);
      doc.text(`Please actively accept or reject this offer utilizing the unique Magic Links provided via your securely sent payload.`);
      doc.moveDown(3);
      doc.text('Sincerely,');
      doc.text('The InnoBytes Team');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

exports.generateAndUploadCertificate = async (studentName, uniqueId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        try {
          const pdfData = Buffer.concat(buffers);
          const result = await uploadBufferToCloudinary(pdfData, `cert_${uniqueId}`);
          resolve(result.secure_url);
        } catch (e) {
          reject(e);
        }
      });

      doc.fontSize(36).text('Certificate of Completion', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(20).text(`This is to certify that ${studentName} successfully engineered the 90-Day MERN Stack Internship Pipeline.`, { align: 'center' });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
