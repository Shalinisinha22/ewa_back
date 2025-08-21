const express = require('express');
const router = express.Router();
const {
  getPublicCategories,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryProducts,
  reorderCategories
} = require('../controllers/categoryController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');

// Public routes (no authentication required)
router.get('/public', identifyStore, getPublicCategories);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('categories'));

// Category routes
router.route('/')
  .get(getCategories)
  .post(createCategory);

router.get('/tree', getCategoryTree);
router.put('/reorder', reorderCategories);

router.route('/:id')
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

router.get('/:id/products', getCategoryProducts);

module.exports = router;