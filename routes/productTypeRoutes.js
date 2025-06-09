const express = require('express');
const {
  createProductType,
  getProductTypes,
  updateProductType,
  deleteProductType,
} = require('../controllers/productTypeController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.route('/').get(getProductTypes);

// Protected routes - Admin only
router.route('/').post(protect, admin, createProductType);
router
  .route('/:id')
  .put(protect, admin, updateProductType)
  .delete(protect, admin, deleteProductType);

module.exports = router;