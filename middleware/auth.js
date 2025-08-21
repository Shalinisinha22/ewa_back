const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from token
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      if (req.admin.status !== 'active') {
        return res.status(401).json({ message: 'Account is not active' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Store isolation middleware - ensure admin can only access their store data
const storeAccess = (req, res, next) => {
  if (!req.admin) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // For super admin, use storeId from admin data or query parameter
  if (req.admin.role === 'super_admin') {
    req.storeId = req.query.storeId || req.admin.storeId || 'default';
    return next();
  }

  // For regular admins, add their storeId to request
  req.storeId = req.admin.storeId ? String(req.admin.storeId) : 'default';
  
  if (!req.storeId || req.storeId === 'null' || req.storeId === 'undefined') {
    req.storeId = 'default';
  }

  next();
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: `Role ${req.admin.role} is not authorized to access this resource` 
      });
    }

    next();
  };
};

// Permission-based access control
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admins have all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has the required permission
    if (!req.admin.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Permission '${permission}' required to access this resource` 
      });
    }

    next();
  };
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  protect,
  storeAccess,
  authorize,
  checkPermission,
  generateToken
};