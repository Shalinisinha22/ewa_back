const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadImage, 
  uploadMultipleImages, 
  uploadVideo, 
  uploadMultipleVideos, 
  deleteFile 
} = require('../controllers/uploadController');
const { protect, storeAccess } = require('../middleware/auth');

// Configure multer for image uploads
const imageStorage = multer.memoryStorage();
const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Configure multer for video uploads
const videoStorage = multer.memoryStorage();
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
});

// Configure multer for mixed uploads (images and videos)
const mixedStorage = multer.memoryStorage();
const mixedUpload = multer({
  storage: mixedStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  },
});

// Protected routes
router.use(protect);
router.use(storeAccess);

// Image upload routes
router.post('/image', imageUpload.single('image'), uploadImage);
router.post('/images', imageUpload.array('images', 10), uploadMultipleImages);

// Video upload routes
router.post('/video', videoUpload.single('video'), uploadVideo);
router.post('/videos', videoUpload.array('videos', 5), uploadMultipleVideos);

// Mixed upload route (for both images and videos)
router.post('/files', mixedUpload.array('files', 10), (req, res) => {
  // This route will handle both images and videos
  // You can implement logic here to separate and process them accordingly
  res.json({ message: 'Mixed upload route - implement as needed' });
});

// Delete route
router.delete('/file', deleteFile);

module.exports = router;