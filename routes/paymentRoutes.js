const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook
} = require('../controllers/paymentController');
const { protectCustomer } = require('../middleware/customerAuth');
const { identifyStore } = require('../middleware/storeIdentification');

// Razorpay routes
router.post('/razorpay/create-order', protectCustomer, identifyStore, createRazorpayOrder);
router.post('/razorpay/verify', protectCustomer, identifyStore, verifyRazorpayPayment);

// Webhook route (no authentication needed)
router.post('/razorpay/webhook', handleRazorpayWebhook);

module.exports = router;

