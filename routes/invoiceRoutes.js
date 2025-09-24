const express = require('express');
const router = express.Router();
const {
  generateInvoice,
  getInvoiceById,
  downloadInvoice,
  getInvoices
} = require('../controllers/invoiceController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected admin routes
router.use(protect);
router.use(storeAccess);

// Invoice management routes
router.route('/')
  .get(checkPermission('orders'), getInvoices);

router.route('/generate')
  .post(checkPermission('orders'), generateInvoice);

router.route('/:id')
  .get(checkPermission('orders'), getInvoiceById);

router.route('/:id/download')
  .get(checkPermission('orders'), downloadInvoice);

module.exports = router;
