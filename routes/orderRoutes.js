const express = require('express');
const router = express.Router();
const {
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  getOrders,
  getOrderStatistics,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
// None

// Protected routes
router
  .route('/')
  .get(protect, admin, getOrders);

router
  .route('/statistics')
  .get(protect, admin, getOrderStatistics);

router
  .route('/:id')
  .get(protect, getOrderById);

router
  .route('/:id/status')
  .put(protect, admin, updateOrderStatus);

router
  .route('/:id/pay')
  .put(protect, updateOrderToPaid);

module.exports = router;