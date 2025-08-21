const fs = require('fs');
const path = require('path');

// Ensure upload directories exist
const createUploadDirectories = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  const imagesDir = path.join(uploadDir, 'images');
  const videosDir = path.join(uploadDir, 'videos');
  
  [uploadDir, imagesDir, videosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Initialize directories
createUploadDirectories();

// Generate unique filename
const generateUniqueFilename = (originalname, storeId = 'default') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  const filename = `${timestamp}_${randomString}${extension}`;
  // Convert storeId to string and use a safe format for URLs
  const safeStoreId = storeId ? String(storeId).replace(/[^a-zA-Z0-9]/g, '') : 'default';
  return `ewa-fashion-${safeStoreId}/${filename}`;
};

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const storeId = req.storeId || 'default';
    console.log('Upload Image - storeId:', storeId, 'type:', typeof storeId);
    
    const filename = generateUniqueFilename(req.file.originalname, storeId);
    console.log('Generated filename:', filename);
    
    const filePath = path.join(__dirname, '../uploads/images', filename);
    console.log('File path:', filePath);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, req.file.buffer);

    // Generate public URL
    const publicUrl = `/uploads/images/${filename}`;
    console.log('Public URL:', publicUrl);

    res.json({
      url: publicUrl,
      publicId: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Image upload failed', error: error.message });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const storeId = req.storeId || 'default';
    const results = [];

    for (const file of req.files) {
      const filename = generateUniqueFilename(file.originalname, storeId);
      const filePath = path.join(__dirname, '../uploads/images', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save file
      fs.writeFileSync(filePath, file.buffer);

      // Generate public URL
      const publicUrl = `/uploads/images/${filename}`;

      results.push({
        url: publicUrl,
        publicId: filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Images upload failed', error: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/upload/video
// @access  Private
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const storeId = req.storeId || 'default';
    const filename = generateUniqueFilename(req.file.originalname, storeId);
    const filePath = path.join(__dirname, '../uploads/videos', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save video file
    fs.writeFileSync(filePath, req.file.buffer);

    // Generate public URL
    const publicUrl = `/uploads/videos/${filename}`;

    res.json({
      url: publicUrl,
      publicId: filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
};

// @desc    Upload multiple videos
// @route   POST /api/upload/videos
// @access  Private
const uploadMultipleVideos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const storeId = req.storeId || 'default';
    const results = [];

    for (const file of req.files) {
      const filename = generateUniqueFilename(file.originalname, storeId);
      const filePath = path.join(__dirname, '../uploads/videos', filename);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save video file
      fs.writeFileSync(filePath, file.buffer);

      // Generate public URL
      const publicUrl = `/uploads/videos/${filename}`;

      results.push({
        url: publicUrl,
        publicId: filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Videos upload failed', error: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/upload/file
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const { publicId, type = 'image' } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    const uploadDir = type === 'video' ? 'videos' : 'images';
    const filePath = path.join(__dirname, `../uploads/${uploadDir}`, publicId);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'File deletion failed' });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  uploadVideo,
  uploadMultipleVideos,
  deleteFile
};