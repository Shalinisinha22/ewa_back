const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesReport,
  getProductReport,
  getCustomerReport,
  getOrderReport,
  getRevenueReport,
  getInventoryReport,
  exportReport
} = require('../controllers/reportController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('reports'));

// Report routes
router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesReport);
router.get('/products', getProductReport);
router.get('/customers', getCustomerReport);
router.get('/orders', getOrderReport);
router.get('/revenue', getRevenueReport);
router.get('/inventory', getInventoryReport);
router.post('/export', exportReport);

module.exports = router;