const cloudinary = require('../config/cloudinary');

// @desc    Upload single image
// @route   POST /api/upload/image
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64 for Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `ewa-fashion/${req.storeId || 'default'}/images`,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
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

    const results = [];
    const uploadPromises = req.files.map(async (file) => {
      try {
        // Convert buffer to base64 for Cloudinary
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: `ewa-fashion/${req.storeId || 'default'}/images`,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' }
          ]
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (error) {
        console.error('Error uploading file:', file.originalname, error);
        return {
          error: error.message,
          originalName: file.originalname
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    results.push(...uploadResults);

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

    // Check file size (limit to 100MB for videos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        message: 'Video file too large. Maximum size is 100MB.' 
      });
    }

    // Validate video file type
    const allowedVideoTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',
      'video/3gp',
      'video/ogg'
    ];

    if (!allowedVideoTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: `Unsupported video format: ${req.file.mimetype}. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, OGG` 
      });
    }

    // Convert buffer to base64 for Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Starting video upload to Cloudinary...');
    console.log('File name:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);
    console.log('Store ID:', req.storeId);

    // Upload to Cloudinary with simplified settings for video
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: `ewa-fashion/${req.storeId || 'default'}/videos`,
      resource_type: 'video',
      timeout: 300000, // 5 minutes timeout for videos
      // Remove transformations and eager settings that might cause issues
      // Cloudinary will handle video optimization automatically
    });

    console.log('Video upload completed successfully');

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Video upload error:', error);
    console.error('Error details:', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
      stack: error.stack
    });
    
    // Handle specific Cloudinary errors
    if (error.http_code === 499) {
      return res.status(408).json({ 
        message: 'Video upload timed out. Please try with a smaller file or check your connection.',
        error: 'Request Timeout'
      });
    }
    
    if (error.http_code === 400) {
      return res.status(400).json({ 
        message: `Invalid video file: ${error.message}. Please check the file format and try again.`,
        error: error.message
      });
    }
    
    if (error.http_code === 413) {
      return res.status(413).json({ 
        message: 'Video file too large. Please try with a smaller file.',
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Video upload failed. Please try again.',
      error: error.message 
    });
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

    // Check total file size
    const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 500 * 1024 * 1024; // 500MB total limit
    if (totalSize > maxTotalSize) {
      return res.status(400).json({ 
        message: 'Total video files too large. Maximum total size is 500MB.' 
      });
    }

    const results = [];
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Check individual file size
        const maxSize = 100 * 1024 * 1024; // 100MB per file
        if (file.size > maxSize) {
          return {
            error: `File ${file.originalname} is too large. Maximum size is 100MB.`,
            originalName: file.originalname
          };
        }

        // Validate video file type
        const allowedVideoTypes = [
          'video/mp4',
          'video/avi',
          'video/mov',
          'video/wmv',
          'video/flv',
          'video/webm',
          'video/mkv',
          'video/3gp',
          'video/ogg'
        ];

        if (!allowedVideoTypes.includes(file.mimetype)) {
          return {
            error: `Unsupported video format for ${file.originalname}: ${file.mimetype}. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP, OGG`,
            originalName: file.originalname
          };
        }

        console.log(`Starting video upload ${index + 1}/${req.files.length}:`, file.originalname);
        
        // Convert buffer to base64 for Cloudinary
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        // Upload to Cloudinary with simplified settings for video
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: `ewa-fashion/${req.storeId || 'default'}/videos`,
          resource_type: 'video',
          timeout: 300000, // 5 minutes timeout for videos
          // Remove transformations and eager settings that might cause issues
          // Cloudinary will handle video optimization automatically
        });

        console.log(`Video upload ${index + 1} completed:`, file.originalname);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        };
      } catch (error) {
        console.error('Error uploading file:', file.originalname, error);
        console.error('Error details:', {
          fileName: file.originalname,
          message: error.message,
          http_code: error.http_code,
          name: error.name
        });
        
        // Handle specific errors
        if (error.http_code === 499) {
          return {
            error: `Upload timed out for ${file.originalname}. Please try with a smaller file.`,
            originalName: file.originalname
          };
        }
        
        if (error.http_code === 400) {
          return {
            error: `Invalid video file ${file.originalname}: ${error.message}`,
            originalName: file.originalname
          };
        }
        
        if (error.http_code === 413) {
          return {
            error: `File ${file.originalname} is too large. Please try with a smaller file.`,
            originalName: file.originalname
          };
        }
        
        return {
          error: error.message,
          originalName: file.originalname
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    results.push(...uploadResults);

    res.json(results);
  } catch (error) {
    console.error('Multiple videos upload error:', error);
    res.status(500).json({ 
      message: 'Videos upload failed. Please try again.',
      error: error.message 
    });
  }
};

// @desc    Delete file from Cloudinary
// @route   DELETE /api/upload/file
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const { publicId, type = 'image' } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: type === 'video' ? 'video' : 'image'
    });

    if (result.result === 'ok') {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'File deletion failed', error: error.message });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  uploadVideo,
  uploadMultipleVideos,
  deleteFile
};