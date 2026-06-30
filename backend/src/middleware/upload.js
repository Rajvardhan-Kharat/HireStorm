const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { Readable } = require('stream');

// Memory storage — we stream directly to Cloudinary, no disk usage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp)'), false);
  },
});

const fs = require('fs');
const path = require('path');

// Upload a buffer to Cloudinary (fallback to local disk if unconfigured/fails)
const uploadToCloudinary = (buffer, folder, publicId) => new Promise((resolve, reject) => {
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  const fallbackToLocal = () => {
    try {
      const uploadDir = path.join(__dirname, '../../public/uploads', folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = `${publicId || Date.now()}.pdf`; // Note: Adjust ext if images are used heavily, but mostly it's PDF or image
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      
      const serverUrl = process.env.API_URL || 'http://localhost:5000';
      console.warn(`[Upload Fallback] Saved locally to ${filePath}`);
      resolve({ secure_url: `${serverUrl}/uploads/${folder}/${filename}` });
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
      folder,
      public_id: publicId,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
    (err, result) => { 
      if (err) {
        console.warn(`[Upload Fallback] Cloudinary upload failed: ${err.message}. Falling back to local disk.`);
        fallbackToLocal();
      } else {
        resolve(result); 
      }
    }
  );
  Readable.from(buffer).pipe(stream);
});

module.exports = { upload, uploadToCloudinary };
