const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderStats,
  exportOrders,
  refundOrder,
  cancelOrder
} = require('../controllers/orderController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('orders'));

// Order routes
router.route('/')
  .get(getOrders)
  .post(createOrder);

router.get('/stats', getOrderStats);
router.get('/export', exportOrders);

router.route('/:id')
  .get(getOrderById)
  .put(updateOrder)
  .delete(deleteOrder);

router.put('/:id/status', updateOrderStatus);
router.post('/:id/refund', refundOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;