# Cloudinary Setup for EWA Fashion Backend

## Overview
This backend now uses Cloudinary for file uploads instead of local storage, which is compatible with Vercel's serverless environment.

## Environment Variables Required

Add these environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=upload_ewa
```

## How to Get Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your Dashboard
3. Copy your Cloud Name, API Key, and API Secret
4. Create an upload preset:
   - Go to Settings > Upload
   - Scroll to Upload presets
   - Create a new preset named "upload_ewa"
   - Set it to "Unsigned" for client-side uploads

## Vercel Deployment

For Vercel deployment, add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each Cloudinary variable listed above

## Benefits of Cloudinary

- ✅ Works with Vercel serverless functions
- ✅ Automatic image optimization and transformations
- ✅ CDN for fast global delivery
- ✅ No local storage management
- ✅ Automatic backup and versioning
- ✅ Supports images, videos, and other media types

## File Structure in Cloudinary

Files will be organized in Cloudinary as:
- Images: `ewa-fashion/{storeId}/images/`
- Videos: `ewa-fashion/{storeId}/videos/`

## Migration from Local Storage

If you have existing products with local file paths, you'll need to:
1. Upload the files to Cloudinary
2. Update the product records with the new Cloudinary URLs
3. Remove the old local files

## API Endpoints

The upload endpoints remain the same:
- `POST /api/upload/image` - Single image upload
- `POST /api/upload/images` - Multiple image upload
- `POST /api/upload/video` - Single video upload
- `POST /api/upload/videos` - Multiple video upload
- `DELETE /api/upload/file` - Delete file from Cloudinary

