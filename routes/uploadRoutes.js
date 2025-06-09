const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    // Create a unique filename with original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File validation
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (!extname || !mimetype) {
    return cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'));
  }

  if (file.size > maxSize) {
    return cb(new Error('File size cannot exceed 5MB!'));
  }

  cb(null, true);
}

// Configure multer upload
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Handle file upload
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the file path
    const filePath = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      path: filePath,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size cannot exceed 5MB'
      });
    }
    return res.status(400).json({
      message: error.message
    });
  }

  // Handle other errors
  res.status(500).json({
    message: error.message || 'Something went wrong during upload'
  });
});

module.exports = router;