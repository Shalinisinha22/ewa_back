const express = require('express');
const router = express.Router();
const {
  getPublicStoreByIdentifier,
  getDefaultStore,
  getAllStores,
  createStore,
  updateStoreStatus,
  updateStore,
  deleteStore,
  resetAdminPassword,
  getStoreById
} = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
// IMPORTANT: Put specific routes before parameterized routes
router.get('/public/default', getDefaultStore);
router.get('/public/:identifier', getPublicStoreByIdentifier);

// Protected routes (Super Admin only)
router.use(protect);
router.use(authorize('super_admin'));

// Store management routes
router.route('/')
  .get(getAllStores)
  .post(createStore);

router.route('/:id')
  .get(getStoreById)
  .put(updateStore)
  .delete(deleteStore);

router.put('/:id/status', updateStoreStatus);
router.post('/:id/reset-password', resetAdminPassword);

module.exports = router; 