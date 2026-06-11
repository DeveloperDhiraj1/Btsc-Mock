const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Local uploads directory initialization
const localUploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const useCloudinaryMock = process.env.USE_CLOUDINARY_MOCK === 'true' ||
                          !cloudName ||
                          cloudName.toLowerCase() === 'untitled' ||
                          !process.env.CLOUDINARY_API_KEY || 
                          !process.env.CLOUDINARY_API_SECRET;

if (!useCloudinaryMock) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else if (process.env.NODE_ENV === 'production') {
  logger.error(
    'PROD WARNING: Cloudinary in Simulation Mode. Render disk is ephemeral — ' +
    'uploads WILL disappear on every redeploy. Set USE_CLOUDINARY_MOCK=false ' +
    'and provide real CLOUDINARY_* credentials.'
  );
} else {
  logger.warn('Running Cloudinary in Simulation Mode (Local Disk Uploads Fallback)');
}

// Set up Multer memory or disk storage depending on Cloudinary presence
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, localUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|csv|xlsx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, or CSV spreadsheets are allowed'));
    }
  }
});

/**
 * Upload a file to Cloudinary (or fallback to local server path)
 * @param {Object} file - Express multer file object
 * @returns {Promise<string>} - The file URL
 */
const uploadToCloudinary = async (file) => {
  if (useCloudinaryMock) {
    // Return local asset URL (express serves the /uploads route)
    const serverUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/uploads/${file.filename}`;
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'btsc-mock-platform',
      resource_type: 'auto'
    });
    // clean up local file after uploading to Cloudinary
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return result.secure_url;
  } catch (error) {
    logger.error('Cloudinary upload error: %O', error);
    if (process.env.NODE_ENV === 'production') {
      logger.error(
        'PROD WARNING: Falling back to local disk for upload — ' +
        'this file will be lost on next Render redeploy. Fix Cloudinary credentials.'
      );
    }
    // fallback to serving local copy if remote fails
    const serverUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/uploads/${file.filename}`;
  }
};

module.exports = {
  upload,
  uploadToCloudinary
};
