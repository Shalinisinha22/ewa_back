const Admin = require('../models/Admin');
const Store = require('../models/Store');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// @desc    Create super admin (Initial setup)
// @route   POST /api/admin/super-admin
// @access  Public (Only for initial setup)
const createSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: 'Super admin already exists. This endpoint is only for initial setup.' 
      });
    }

    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Create super admin (NO STORE - platform level only)
    const superAdmin = await Admin.create({
      name,
      email,
      password,
      status: 'active',
      storeName: 'EWA Fashion Platform', // Platform name, not a store
      storeId: null, // No store assigned
      role: 'super_admin',
      permissions: ['products', 'categories', 'orders', 'customers', 'coupons', 'banners', 'pages', 'reports', 'settings'],
      isEmailVerified: true
    });

    res.status(201).json({
      message: 'Super admin created successfully',
      admin: {
        _id: superAdmin._id,
        name: superAdmin.name,
        email: superAdmin.email,
        status: superAdmin.status,
        storeName: superAdmin.storeName,
        storeId: superAdmin.storeId,
        role: superAdmin.role,
        permissions: superAdmin.permissions
      },
      token: generateToken(superAdmin._id)
    });
  } catch (error) {
    console.error('Super admin creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create new admin
// @route   POST /api/admin
// @access  Private (Super Admin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, status, storeName, permissions } = req.body;

    // Only super admin can create admins
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only super admin can create admins.' 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Validate required fields for store creation
    if (!storeName) {
      return res.status(400).json({ 
        message: 'Store name is required when creating an admin' 
      });
    }

    // Create or find store
    let store = await Store.findOne({ name: storeName });
    if (!store) {
      store = await Store.create({
        name: storeName,
        slug: storeName.toLowerCase().replace(/\s+/g, '-'),
        description: `${storeName} - Fashion Store`,
        status: 'active',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          language: 'en'
        }
      });
    }

    // Create admin with full permissions for their store
    const admin = await Admin.create({
      name,
      email,
      password,
      status: status || 'active',
      storeName: store.name,
      storeId: store._id,
      role: 'admin', // Always create as admin (not manager)
      permissions: permissions || [
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
      message: 'Admin created successfully with store access',
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        status: admin.status,
        storeName: admin.storeName,
        storeId: admin.storeId,
        role: admin.role,
        permissions: admin.permissions
      },
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status
      },
      token: generateToken(admin._id)
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all admins
// @route   GET /api/admin
// @access  Private (Super Admin, Store Admin)
const getAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Store isolation
    if (req.admin.role !== 'super_admin') {
      query.storeId = req.storeId;
    } else if (req.query.storeId) {
      query.storeId = req.query.storeId;
    }

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { storeName: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Role filter
    if (req.query.role) {
      query.role = req.query.role;
    }

    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Admin.countDocuments(query);

    res.json({
      admins,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin by ID
// @route   GET /api/admin/:id
// @access  Private (Super Admin, Store Admin)
const getAdminById = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Store isolation
    if (req.admin.role !== 'super_admin') {
      query.storeId = req.storeId;
    }

    const admin = await Admin.findOne(query).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin
// @route   PUT /api/admin/:id
// @access  Private (Super Admin, Store Admin)
const updateAdmin = async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Store isolation
    if (req.admin.role !== 'super_admin') {
      query.storeId = req.storeId;
    }

    const admin = await Admin.findOne(query);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Update fields
    const { name, email, status, role, permissions } = req.body;
    
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (status) admin.status = status;
    if (role && req.admin.role === 'super_admin') admin.role = role;
    if (permissions) admin.permissions = permissions;

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      status: updatedAdmin.status,
      storeName: updatedAdmin.storeName,
      storeId: updatedAdmin.storeId,
      role: updatedAdmin.role,
      permissions: updatedAdmin.permissions
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private (Super Admin only)
const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent deleting self
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return res.status(401).json({ message: 'Account is not active' });
    }

    // Update last login
    await admin.updateLastLogin();

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      status: admin.status,
      storeName: admin.storeName,
      storeId: admin.storeId,
      role: admin.role,
      permissions: admin.permissions,
      token: generateToken(admin._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { name, email, avatar } = req.body;
    
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (avatar) admin.avatar = avatar;

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      status: updatedAdmin.status,
      storeName: updatedAdmin.storeName,
      storeId: updatedAdmin.storeId,
      role: updatedAdmin.role,
      permissions: updatedAdmin.permissions,
      avatar: updatedAdmin.avatar
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/profile/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSuperAdmin,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  changePassword
};