const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const PHOTO_DIR = path.join(__dirname, '..', '..', 'uploads', 'photos');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PHOTO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

module.exports = { upload, PHOTO_DIR };
