const express = require('express');
const router = express.Router();
const {
  customerSignup,
  customerLogin,
  getCustomerProfile,
  updateCustomerProfile,
  changePassword,
  getCustomerOrders,
  createCustomerOrder,
  getCustomerOrderById
} = require('../controllers/customerAuthController');
const { protectCustomer } = require('../middleware/customerAuth');

// Public routes
router.post('/signup', customerSignup);
router.post('/login', customerLogin);

// Protected routes
router.use(protectCustomer);
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.put('/change-password', changePassword);
router.get('/orders', getCustomerOrders);
router.post('/orders', createCustomerOrder);
router.get('/orders/:id', getCustomerOrderById);

module.exports = router; 