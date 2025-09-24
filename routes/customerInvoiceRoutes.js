const express = require('express');
const router = express.Router();
const {
  getCustomerInvoiceByOrderId,
  downloadInvoice,
  generateInvoiceForOrder
} = require('../controllers/invoiceController');
const { protectCustomer } = require('../middleware/customerAuth');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`Customer Invoice Route: ${req.method} ${req.path}`);
  next();
});

// Customer invoice routes
router.get('/order/:orderId', (req, res, next) => {
  console.log('Route matched: GET /order/:orderId with orderId:', req.params.orderId);
  next();
}, protectCustomer, getCustomerInvoiceByOrderId);

router.get('/order/:orderId/download', (req, res, next) => {
  console.log('Route matched: GET /order/:orderId/download with orderId:', req.params.orderId);
  next();
}, protectCustomer, downloadInvoice);

router.post('/order/:orderId/generate', (req, res, next) => {
  console.log('Route matched: POST /order/:orderId/generate with orderId:', req.params.orderId);
  next();
}, protectCustomer, generateInvoiceForOrder);

module.exports = router;
