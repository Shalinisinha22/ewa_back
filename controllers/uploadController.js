import asyncHandler from 'express-async-handler';

const uploadImage = asyncHandler(async (req, res) => {
  if (req.file) {
  
    const imagePath = `/uploads/${req.file.filename}`;
    res.json(imagePath);
  } else {
    res.status(400);
    throw new Error('No file uploaded');
  }
});

export { uploadImage };