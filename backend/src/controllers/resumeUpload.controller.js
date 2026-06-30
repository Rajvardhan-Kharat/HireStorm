/**
 * Resume Upload + AI Text Extraction
 * POST /api/v1/college/apply/:token/upload-resume
 *
 * Accepts a PDF (≤5 MB), uploads to Cloudinary, then extracts
 * text content from it using Gemini's vision/file API.
 */
const { cloudinary }         = require('../config/cloudinary');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Readable }           = require('stream');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const fs = require('fs');
const path = require('path');

// ─── Stream buffer to Cloudinary (raw PDF) with local fallback ───────────────
const uploadPDFBuffer = (buffer, token) => {
  return new Promise((resolve, reject) => {
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

    const fallbackToLocal = () => {
      try {
        const uploadDir = path.join(__dirname, '../../../public/uploads/resumes');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `resume_${token}_${Date.now()}.pdf`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        
        const serverUrl = process.env.API_URL || 'http://localhost:5000';
        console.warn(`[Upload Fallback] Saved resume locally to ${filePath}`);
        resolve({ secure_url: `${serverUrl}/uploads/resumes/${filename}` });
      } catch (localErr) {
        reject(localErr);
      }
    };

    if (!isCloudinaryConfigured) {
      console.warn('[Upload Fallback] Cloudinary not configured. Falling back to local disk.');
      return fallbackToLocal();
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'hirestorm/resumes',
        resource_type: 'raw',
        format:        'pdf',
        public_id:     `resume_${token}_${Date.now()}`,
        overwrite:     true,
      },
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

// ─── Extract text via Gemini inline PDF ───────────────────────────────────────
const extractTextWithGemini = async (pdfBuffer) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const base64pdf = pdfBuffer.toString('base64');

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data:     base64pdf,
      },
    },
    {
      text: `Extract ALL text content from this resume PDF.
Include: name, contact details, education, skills, work experience, projects, certifications, achievements.
Return the text as-is — do NOT summarize, do NOT add formatting, just return the raw extracted text.
If the PDF has multiple pages, extract all of them.`,
    },
  ]);

  return result.response.text().trim();
};

// ─── Controller ───────────────────────────────────────────────────────────────
exports.uploadResumeAndExtractText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { buffer, mimetype, size } = req.file;

    // Validate
    if (mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are accepted.' });
    }
    if (size > 5 * 1024 * 1024) {  // 5 MB
      return res.status(400).json({ success: false, message: 'File too large. Maximum allowed size is 5 MB.' });
    }

    const token = req.params.token;

    // 1️⃣ Upload to Cloudinary
    let resumeUrl = null;
    try {
      const result = await uploadPDFBuffer(buffer, token);
      resumeUrl = result.secure_url;
    } catch (uploadErr) {
      console.error('[Resume Upload] Cloudinary error:', uploadErr.message);
      // non-fatal — we still extract text
    }

    // 2️⃣ Extract text via Gemini
    let resumeText = '';
    try {
      resumeText = await extractTextWithGemini(buffer);
    } catch (extractErr) {
      console.error('[Resume Extract] Gemini error:', extractErr.message);
      resumeText = ''; // fallback — ATS will use skills/projects instead
    }

    res.json({
      success:    true,
      resumeUrl,
      resumeText,
      message:    resumeUrl
        ? 'Resume uploaded and text extracted successfully.'
        : 'Text extracted but upload failed. You can still submit.',
    });
  } catch (err) {
    console.error('[uploadResumeAndExtractText]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
