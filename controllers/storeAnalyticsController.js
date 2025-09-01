const Store = require('../models/Store');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get store analytics overview
// @route   GET /api/store-analytics/:storeId/overview
// @access  Private (Super Admin)
const getStoreOverview = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get store details
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get orders for the time range
    const orders = await Order.find({
      storeId,
      createdAt: { $gte: startDate, $lte: now }
    });

    // Get all-time orders for total stats
    const allTimeOrders = await Order.find({ storeId });

    // Calculate revenue and commission
    const totalRevenue = allTimeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const periodRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const commissionRate = store.settings?.commissionRate || 8.0;
    const totalCommission = totalRevenue * (commissionRate / 100);
    const periodCommission = periodRevenue * (commissionRate / 100);

    // Calculate order statistics
    const totalOrders = allTimeOrders.length;
    const periodOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get customer count
    const customerCount = await Customer.countDocuments({ storeId });

    // Get product count
    const productCount = await Product.countDocuments({ storeId });

    // Calculate growth percentages (mock data for now)
    const revenueGrowth = '+12.5%';
    const orderGrowth = '+15.7%';
    const customerGrowth = '+8.3%';

    res.json({
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status,
        settings: store.settings
      },
      analytics: {
        revenue: {
          total: totalRevenue,
          period: periodRevenue,
          growth: revenueGrowth
        },
        orders: {
          total: totalOrders,
          period: periodOrders,
          growth: orderGrowth,
          averageValue: averageOrderValue
        },
        customers: {
          total: customerCount,
          growth: customerGrowth
        },
        products: {
          total: productCount
        },
        commission: {
          rate: commissionRate,
          total: totalCommission,
          period: periodCommission
        }
      },
      timeRange: {
        start: startDate,
        end: now,
        period: timeRange
      }
    });
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get store customers
// @route   GET /api/store-analytics/:storeId/customers
// @access  Private (Super Admin)
const getStoreCustomers = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = { storeId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get store orders
// @route   GET /api/store-analytics/:storeId/orders
// @access  Private (Super Admin)
const getStoreOrders = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20, status = '', timeRange = '30d' } = req.query;
    const skip = (page - 1) * limit;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = { 
      storeId,
      createdAt: { $gte: startDate, $lte: now }
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get store revenue trends
// @route   GET /api/store-analytics/:storeId/revenue-trends
// @access  Private (Super Admin)
const getStoreRevenueTrends = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    let interval;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = 'day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        interval = 'week';
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = 'month';
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = 'day';
    }

    // Get orders for the time range
    const orders = await Order.find({
      storeId,
      createdAt: { $gte: startDate, $lte: now }
    });

    // Group orders by date and calculate revenue
    const revenueData = {};
    const commissionData = {};
    const store = await Store.findById(storeId);
    const commissionRate = store?.settings?.commissionRate || 8.0;

    orders.forEach(order => {
      let dateKey;
      if (interval === 'day') {
        dateKey = order.createdAt.toISOString().split('T')[0];
      } else if (interval === 'week') {
        const weekStart = new Date(order.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else {
        dateKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!revenueData[dateKey]) {
        revenueData[dateKey] = 0;
        commissionData[dateKey] = 0;
      }

      revenueData[dateKey] += order.totalAmount || 0;
      commissionData[dateKey] += (order.totalAmount || 0) * (commissionRate / 100);
    });

    // Convert to array format
    const trends = Object.keys(revenueData).map(date => ({
      date,
      revenue: revenueData[date],
      commission: commissionData[date]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      trends,
      interval,
      timeRange: {
        start: startDate,
        end: now,
        period: timeRange
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get store activity logs
// @route   GET /api/store-analytics/:storeId/activity-logs
// @access  Private (Super Admin)
const getStoreActivityLogs = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // For now, we'll create mock activity logs based on orders
    // In a real application, you'd have a separate ActivityLog model
    const orders = await Order.find({ storeId })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const activityLogs = orders.map((order, index) => ({
      id: `log_${order._id}`,
      type: 'order',
      description: `Order #${order.orderNumber} placed by ${order.customerId?.name || 'Customer'}`,
      timestamp: order.createdAt,
      severity: 'low',
      orderAmount: order.totalAmount,
      customerEmail: order.customerId?.email
    }));

    // Add some mock admin activity logs
    const mockLogs = [
      {
        id: 'log_admin_1',
        type: 'login',
        description: 'Store admin logged in',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        severity: 'low'
      },
      {
        id: 'log_admin_2',
        type: 'product_update',
        description: '5 products updated',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        severity: 'medium'
      }
    ];

    const allLogs = [...mockLogs, ...activityLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    res.json({
      logs: allLogs.slice(0, parseInt(limit)),
      page: parseInt(page),
      pages: Math.ceil(allLogs.length / limit),
      total: allLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStoreOverview,
  getStoreCustomers,
  getStoreOrders,
  getStoreRevenueTrends,
  getStoreActivityLogs
};
