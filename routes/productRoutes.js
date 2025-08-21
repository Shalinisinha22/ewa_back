const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getPublicProducts,
  getPublicProductsByCategory,
  getProductsByCategory,
  searchProducts,
  updateProductStock,
  bulkUpdateProducts,
  getProductStats,
  recalculateCategoryProductCounts,
  bulkUploadProducts
} = require('../controllers/productController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

// Public routes (no authentication required)
router.get('/public', identifyStore, getPublicProducts);
router.get('/public/featured', identifyStore, getFeaturedProducts);
router.get('/public/search', identifyStore, searchProducts);
router.get('/public/category/:categoryId', identifyStore, getPublicProductsByCategory);
router.get('/public/:id', identifyStore, getProductById);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('products'));

// Product routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/stats', getProductStats);
router.get('/category/:categoryId', getProductsByCategory);
router.post('/recalculate-category-counts', recalculateCategoryProductCounts);
router.post('/bulk-upload', csvUpload.single('csv'), bulkUploadProducts);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.put('/:id/stock', updateProductStock);
router.put('/bulk/update', bulkUpdateProducts);

module.exports = router;