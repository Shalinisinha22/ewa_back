const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerOrders,
  exportCustomers,
  blockCustomer,
  unblockCustomer
} = require('../controllers/customerController');
const {
  getShippingSettings,
  getPaymentSettings,
  getTaxSettings
} = require('../controllers/settingController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');

// Public customer routes for store settings (only require store identification)
router.get('/store/shipping', identifyStore, getShippingSettings);
router.get('/store/payment', identifyStore, getPaymentSettings);
router.get('/store/tax', identifyStore, getTaxSettings);

// Protected admin routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('customers'));

// Customer routes
router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.get('/stats', getCustomerStats);
router.get('/export', exportCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

router.get('/:id/orders', getCustomerOrders);
router.put('/:id/block', blockCustomer);
router.put('/:id/unblock', unblockCustomer);

module.exports = router;