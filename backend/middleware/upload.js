const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine a writable directory for uploads.
// On serverless environments like Vercel/AWS Lambda where /var/task is read-only,
// safely use os.tmpdir() (/tmp). On standard local/server environments, use ../uploads.
const getUploadsDir = () => {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch (e) {
      return os.tmpdir();
    }
  }

  try {
    const localDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch (err) {
    const tmpFallback = path.join(os.tmpdir(), 'uploads');
    try {
      if (!fs.existsSync(tmpFallback)) {
        fs.mkdirSync(tmpFallback, { recursive: true });
      }
      return tmpFallback;
    } catch (e) {
      return os.tmpdir();
    }
  }
};

const uploadsDir = getUploadsDir();

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, getUploadsDir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'produce-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

module.exports = upload;
