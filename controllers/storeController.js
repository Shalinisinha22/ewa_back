const Store = require('../models/Store');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// @desc    Get store by identifier (name or slug) (Public)
// @route   GET /api/stores/public/:identifier
// @access  Public
const getPublicStoreByIdentifier = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    // Try to find store by name first (case-insensitive)
    let store = await Store.findOne({
      name: { $regex: new RegExp(identifier, 'i') },
      status: 'active'
    });

    // If not found by name, try by slug
    if (!store) {
      store = await Store.findOne({
        slug: identifier,
        status: 'active'
      });
    }

    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found',
        error: 'The requested store does not exist or is not active'
      });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get default store (Public)
// @route   GET /api/stores/public/default
// @access  Public
const getDefaultStore = async (req, res) => {
  try {
    const store = await Store.findOne({ 
      status: 'active' 
    }).sort({ createdAt: 1 });

    if (!store) {
      return res.status(404).json({ 
        message: 'No stores available',
        error: 'No active stores found in the system'
      });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stores (Super Admin only)
// @route   GET /api/stores
// @access  Private (Super Admin)
const getAllStores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { slug: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Store.countDocuments(query);

    res.json({
      stores,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new store with admin
// @route   POST /api/stores
// @access  Private (Super Admin)
const createStore = async (req, res) => {
  try {
    const { 
      name, 
      subdomain, 
      adminName, 
      adminEmail, 
      adminPassword,
      commissionRate = 8.0 
    } = req.body;

    // Check if store with this name or subdomain already exists
    const existingStore = await Store.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { slug: subdomain }
      ]
    });

    if (existingStore) {
      return res.status(400).json({ 
        message: 'Store with this name or subdomain already exists' 
      });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin with this email already exists' 
      });
    }

    // Create store
    const store = await Store.create({
      name,
      slug: subdomain,
      description: `${name} - Fashion Store`,
      status: 'pending',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        language: 'en',
        commissionRate: parseFloat(commissionRate)
      }
    });

    // Create admin for the store
    const admin = await Admin.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword || 'defaultPassword123', // In production, generate a secure password
      status: 'active',
      storeName: store.name,
      storeId: store._id,
      role: 'admin',
      permissions: [
        'products', 
        'categories', 
        'orders', 
        'customers', 
        'coupons', 
        'banners', 
        'pages', 
        'reports', 
        'settings'
      ],
      isEmailVerified: true
    });

    res.status(201).json({
      message: 'Store and admin created successfully',
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        settings: store.settings
      },
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Store creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update store status
// @route   PUT /api/stores/:id/status
// @access  Private (Super Admin)
const updateStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const validStatuses = ['active', 'pending', 'disabled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be one of: active, pending, disabled' 
      });
    }

    const store = await Store.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({
      message: 'Store status updated successfully',
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private (Super Admin)
const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Delete associated admin
    await Admin.deleteMany({ storeId: store._id });

    // Delete the store
    await Store.findByIdAndDelete(id);

    res.json({ message: 'Store and associated admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset admin password
// @route   POST /api/stores/:id/reset-password
// @access  Private (Super Admin)
const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail } = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const admin = await Admin.findOne({ 
      email: adminEmail, 
      storeId: store._id 
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found for this store' });
    }

    // Generate a new password (in production, send this via email)
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    admin.password = newPassword;
    await admin.save();

    res.json({
      message: 'Password reset successfully',
      newPassword: newPassword, // In production, don't return this - send via email
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store details
// @route   PUT /api/stores/:id
// @access  Private (Super Admin)
const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, adminName, adminEmail, commissionRate } = req.body;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Update store fields
    if (name) store.name = name;
    if (slug) store.slug = slug;
    if (commissionRate !== undefined) {
      store.settings = store.settings || {};
      store.settings.commissionRate = commissionRate;
    }

    // Update admin details if provided
    if (adminName || adminEmail) {
      const admin = await Admin.findOne({ storeId: store._id });
      if (admin) {
        if (adminName) admin.name = adminName;
        if (adminEmail) admin.email = adminEmail;
        await admin.save();
      }
    }

    await store.save();

    res.json({
      message: 'Store updated successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get store by ID
// @route   GET /api/stores/:id
// @access  Private (Super Admin)
const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findById(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get associated admin
    const admin = await Admin.findOne({ storeId: store._id }).select('-password');

    res.json({
      store,
      admin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicStoreByIdentifier,
  getDefaultStore,
  getAllStores,
  createStore,
  updateStoreStatus,
  updateStore,
  deleteStore,
  resetAdminPassword,
  getStoreById
}; 