const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const config = require('../config/config');

// Protect customer routes
const protectCustomer = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Check if token is for customer
      if (decoded.type !== 'customer') {
        return res.status(401).json({ message: 'Not authorized as customer' });
      }

      // Get customer from token
      req.customer = await Customer.findById(decoded.id).select('-password');

      if (!req.customer) {
        return res.status(401).json({ message: 'Customer not found' });
      }

      // Check if customer is blocked
      if (req.customer.status === 'blocked') {
        return res.status(401).json({ message: 'Your account has been blocked' });
      }

      // Set store ID from customer or header
      req.storeId = req.customer.storeId ? String(req.customer.storeId) : req.headers['x-store-id'];

      next();
    } catch (error) {
      console.error('Customer auth error:', error);
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protectCustomer }; 