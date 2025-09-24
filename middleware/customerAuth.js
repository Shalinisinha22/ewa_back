const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Store = require('../models/Store');
const config = require('../config/config');

// Protect customer routes
const protectCustomer = async (req, res, next) => {
  let token;
  
  console.log('protectCustomer middleware called for:', req.method, req.path);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? 'Yes' : 'No');

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('Token decoded successfully, type:', decoded.type);

      // Check if token is for customer
      if (decoded.type !== 'customer') {
        console.log('Token type mismatch, expected customer, got:', decoded.type);
        return res.status(401).json({ message: 'Not authorized as customer' });
      }

      // Get customer from token
      req.customer = await Customer.findById(decoded.id).select('-password');
      console.log('Customer found:', req.customer ? 'Yes' : 'No');

      if (!req.customer) {
        console.log('Customer not found in database');
        return res.status(401).json({ message: 'Customer not found' });
      }

      // Check if customer is blocked
      if (req.customer.status === 'blocked') {
        console.log('Customer is blocked');
        return res.status(401).json({ message: 'Your account has been blocked' });
      }

      // Set store ID from customer or header
      req.storeId = req.customer.storeId ? String(req.customer.storeId) : req.headers['x-store-id'];
      console.log('Store ID set:', req.storeId);

      // Get store details
      if (req.storeId) {
        const store = await Store.findById(req.storeId);
        if (store) {
          req.store = store;
        }
      }

      console.log('Customer auth successful, calling next()');
      next();
    } catch (error) {
      console.error('Customer auth error:', error);
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    console.log('No authorization header found');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protectCustomer }; 