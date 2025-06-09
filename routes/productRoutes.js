const express = require('express');
const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
} = require('../controllers/productController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Public routes
router.route('/').get(getProducts);

router.route('/:id').get(getProductById);

// Protected routes - Admin only
router.route('/').post(protect, admin, createProduct);

router
  .route('/:id')
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct);

module.exports = router;