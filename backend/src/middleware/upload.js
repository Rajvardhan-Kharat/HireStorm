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

// Upload a buffer to Cloudinary and return the result
const uploadToCloudinary = (buffer, folder, publicId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder,
      public_id: publicId,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
    (err, result) => { if (err) reject(err); else resolve(result); }
  );
  Readable.from(buffer).pipe(stream);
});

module.exports = { upload, uploadToCloudinary };
