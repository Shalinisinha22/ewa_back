const express = require('express');
const router = express.Router();
const {
  getStoreOverview,
  getStoreCustomers,
  getStoreOrders,
  getStoreRevenueTrends,
  getStoreActivityLogs,
  getStoreCommissionInvoice
} = require('../controllers/storeAnalyticsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and super admin role
router.use(protect);
router.use(authorize('super_admin'));

// Store analytics routes
router.get('/:storeId/overview', getStoreOverview);
router.get('/:storeId/customers', getStoreCustomers);
router.get('/:storeId/orders', getStoreOrders);
router.get('/:storeId/revenue-trends', getStoreRevenueTrends);
router.get('/:storeId/activity-logs', getStoreActivityLogs);
router.get('/:storeId/commission-invoice', getStoreCommissionInvoice);

module.exports = router;





