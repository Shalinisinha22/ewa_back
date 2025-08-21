# Free Upload System Documentation

## Overview
This system replaces Cloudinary with a completely free local file storage solution using Multer and Node.js file system.

## Features
- ✅ **Completely Free** - No external service costs
- ✅ **Image Upload** - Support for all image formats (JPEG, PNG, GIF, WebP, etc.)
- ✅ **Video Upload** - Support for all video formats (MP4, AVI, MOV, etc.)
- ✅ **Multiple File Upload** - Upload multiple images or videos at once
- ✅ **File Organization** - Files organized by store ID
- ✅ **Unique Filenames** - Prevents filename conflicts
- ✅ **File Size Limits** - Configurable limits (10MB for images, 100MB for videos)
- ✅ **Static File Serving** - Files served directly by Express

## API Endpoints

### Image Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images (max 10)

### Video Upload
- `POST /api/upload/video` - Upload single video
- `POST /api/upload/videos` - Upload multiple videos (max 5)

### File Management
- `DELETE /api/upload/file` - Delete file (requires publicId and type)

## File Structure
```
uploads/
├── images/
│   └── ewa-fashion-{storeId}/
│       ├── 1234567890_abc123.jpg
│       └── 1234567891_def456.png
└── videos/
    └── ewa-fashion-{storeId}/
        ├── 1234567892_ghi789.mp4
        └── 1234567893_jkl012.avi
```

## Response Format
```json
{
  "url": "/uploads/images/ewa-fashion-123/1234567890_abc123.jpg",
  "publicId": "ewa-fashion-123/1234567890_abc123.jpg",
  "originalName": "product-image.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg"
}
```

## Usage Examples

### Frontend Image Upload
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.url); // Use this URL in your app
```

### Frontend Video Upload
```javascript
const formData = new FormData();
formData.append('video', videoFile);

const response = await fetch('/api/upload/video', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result.url); // Use this URL in your app
```

## Configuration

### File Size Limits
- Images: 10MB
- Videos: 100MB
- Can be modified in `routes/uploadRoutes.js`

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP, BMP, TIFF, SVG
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM, MKV

## Security Features
- ✅ Authentication required for all upload endpoints
- ✅ Store access validation
- ✅ File type validation
- ✅ File size limits
- ✅ Unique filename generation
- ✅ Organized by store ID

## Migration from Cloudinary
1. Remove Cloudinary environment variables
2. Update frontend to use new API endpoints
3. Files are now served from `/uploads/` path
4. No external dependencies required

## Benefits
- 🆓 **Zero Cost** - No monthly fees or usage limits
- 🚀 **Fast** - Direct file serving from server
- 🔒 **Secure** - Full control over file access
- 📁 **Organized** - Clear file structure
- 🔧 **Customizable** - Easy to modify and extend

## Notes
- Files are stored locally on the server
- Ensure adequate disk space for uploads
- Consider implementing file cleanup for unused files
- For production, consider using a CDN for better performance 