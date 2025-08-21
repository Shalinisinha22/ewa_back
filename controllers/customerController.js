const Customer = require('../models/Customer');
const Order = require('../models/Order');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      storeId: req.storeId
    };

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      email: customerData.email,
      storeId: req.storeId
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    const customer = await Customer.create(customerData);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check email uniqueness if email is being updated
    if (req.body.email && req.body.email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email: req.body.email,
        storeId: req.storeId,
        _id: { $ne: req.params.id }
      });

      if (existingCustomer) {
        return res.status(400).json({ message: 'Customer with this email already exists' });
      }
    }

    Object.assign(customer, req.body);
    const updatedCustomer = await customer.save();

    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has orders
    const orderCount = await Order.countDocuments({
      customer: req.params.id,
      storeId: req.storeId
    });

    if (orderCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete customer with ${orderCount} orders. Consider deactivating instead.` 
      });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Private
const getCustomerStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          blockedCustomers: {
            $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] }
          },
          verifiedEmails: {
            $sum: { $cond: ['$emailVerified', 1, 0] }
          },
          verifiedPhones: {
            $sum: { $cond: ['$phoneVerified', 1, 0] }
          },
          totalSpent: { $sum: '$orderStats.totalSpent' },
          averageSpent: { $avg: '$orderStats.totalSpent' }
        }
      }
    ]);

    // Get customer registration trend
    const registrationTrend = await Customer.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Get top customers by spending
    const topCustomers = await Customer.find({
      storeId: req.storeId,
      'orderStats.totalSpent': { $gt: 0 }
    })
      .sort({ 'orderStats.totalSpent': -1 })
      .limit(10)
      .select('firstName lastName email orderStats.totalSpent orderStats.totalOrders');

    res.json({
      overview: stats[0] || {
        totalCustomers: 0,
        activeCustomers: 0,
        blockedCustomers: 0,
        verifiedEmails: 0,
        verifiedPhones: 0,
        totalSpent: 0,
        averageSpent: 0
      },
      registrationTrend,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer orders
// @route   GET /api/customers/:id/orders
// @access  Private
const getCustomerOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({
      customer: req.params.id,
      storeId: req.storeId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({
      customer: req.params.id,
      storeId: req.storeId
    });

    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export customers
// @route   GET /api/customers/export
// @access  Private
const exportCustomers = async (req, res) => {
  try {
    let query = { storeId: req.storeId };

    // Apply filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.startDate) query.createdAt = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(req.query.endDate) };
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csvData = customers.map(customer => ({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      status: customer.status,
      totalOrders: customer.orderStats.totalOrders,
      totalSpent: customer.orderStats.totalSpent,
      createdAt: customer.createdAt.toISOString().split('T')[0]
    }));

    res.json(csvData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block customer
// @route   PUT /api/customers/:id/block
// @access  Private
const blockCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.status = 'blocked';
    const updatedCustomer = await customer.save();

    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Unblock customer
// @route   PUT /api/customers/:id/unblock
// @access  Private
const unblockCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.status = 'active';
    const updatedCustomer = await customer.save();

    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};