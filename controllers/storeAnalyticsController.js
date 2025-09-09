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

    // Calculate previous period for growth comparison
    const periodDuration = now.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime());

    // Get previous period orders
    const previousOrders = await Order.find({
      storeId,
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });

    // Calculate revenue and commission
    const totalRevenue = allTimeOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const periodRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const previousPeriodRevenue = previousOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    
    const commissionRate = store.settings?.commissionRate || 8.0;
    const totalCommission = totalRevenue * (commissionRate / 100);
    const periodCommission = periodRevenue * (commissionRate / 100);

    // Calculate order statistics
    const totalOrders = allTimeOrders.length;
    const periodOrders = orders.length;
    const previousPeriodOrders = previousOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get customer counts for growth calculation
    const customerCount = await Customer.countDocuments({ storeId });
    const previousPeriodCustomerCount = await Customer.countDocuments({
      storeId,
      createdAt: { $gte: previousStartDate, $lt: previousEndDate }
    });

    // Get product count
    const productCount = await Product.countDocuments({ storeId });

    // Calculate real growth percentages
    const calculateGrowthPercentage = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? '+100%' : '0%';
      }
      const growth = ((current - previous) / previous) * 100;
      return growth >= 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`;
    };

    const revenueGrowth = calculateGrowthPercentage(periodRevenue, previousPeriodRevenue);
    const orderGrowth = calculateGrowthPercentage(periodOrders, previousPeriodOrders);
    const customerGrowth = calculateGrowthPercentage(customerCount, previousPeriodCustomerCount);

    // Debug logging for growth calculations
    console.log(`Store ${storeId} Growth Calculations:`, {
      timeRange,
      currentPeriod: { start: startDate, end: now },
      previousPeriod: { start: previousStartDate, end: previousEndDate },
      revenue: { current: periodRevenue, previous: previousPeriodRevenue, growth: revenueGrowth },
      orders: { current: periodOrders, previous: previousPeriodOrders, growth: orderGrowth },
      customers: { current: customerCount, previous: previousPeriodCustomerCount, growth: customerGrowth }
    });

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

// @desc    Get store customers with their order details
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

    // Get order details for each customer
    const customersWithOrders = await Promise.all(
      customers.map(async (customer) => {
        const customerOrders = await Order.find({ 
          storeId, 
          customer: customer._id 
        })
        .sort({ createdAt: -1 })
        .limit(10) // Get last 10 orders
        .select('orderNumber pricing.total status createdAt');

        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
        const totalOrders = customerOrders.length;

        return {
          ...customer.toObject(),
          orderStats: {
            totalOrders,
            totalSpent,
            lastOrderDate: customerOrders[0]?.createdAt || null,
            recentOrders: customerOrders.map(order => ({
              ...order.toObject(),
              totalAmount: order.pricing?.total || 0
            }))
          }
        };
      })
    );

    const total = await Customer.countDocuments(query);

    // Debug logging
    console.log(`Store ${storeId} Customers API Response:`, {
      totalCustomers: total,
      customersReturned: customersWithOrders.length,
      sampleCustomer: customersWithOrders[0] ? {
        id: customersWithOrders[0]._id,
        name: customersWithOrders[0].name,
        email: customersWithOrders[0].email,
        orderStats: customersWithOrders[0].orderStats
      } : null
    });

    res.json({
      customers: customersWithOrders,
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

// @desc    Get store commission invoice for super admin
// @route   GET /api/store-analytics/:storeId/commission-invoice
// @access  Private (Super Admin)
const getStoreCommissionInvoice = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    // Get store details
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Set date range (default to last 30 days if not provided)
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : now;

    // Get orders in the date range (include all orders, not just delivered/completed)
    const orders = await Order.find({
      storeId,
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate commission details
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
    const commissionRate = store.settings?.commissionRate || 8.0;
    
    // Debug store settings
    console.log(`Store ${storeId} Settings:`, {
      commissionRate,
      settings: store.settings
    });
    
    const totalCommission = totalRevenue * (commissionRate / 100);
    const netRevenue = totalRevenue - totalCommission;

    // Get order breakdown by status
    const orderBreakdown = await Order.aggregate([
      { $match: { storeId, createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      }
    ]);

    console.log(`Order breakdown for store ${storeId}:`, orderBreakdown);

    // Get monthly breakdown for the period
    const monthlyBreakdown = await Order.aggregate([
      { 
        $match: { 
          storeId, 
          createdAt: { $gte: start, $lte: end }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    console.log(`Monthly breakdown for store ${storeId}:`, monthlyBreakdown);

    // Debug logging for commission invoice
    console.log(`Store ${storeId} Commission Invoice Debug:`, {
      dateRange: { start, end },
      totalOrders: orders.length,
      totalRevenue,
      commissionRate,
      totalCommission,
      orderBreakdown,
      monthlyBreakdown,
      sampleOrders: orders.slice(0, 3).map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.pricing?.total,
        createdAt: order.createdAt
      }))
    });

    const invoice = {
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        adminEmail: store.admin?.email,
        commissionRate: commissionRate
      },
      period: {
        start: start,
        end: end,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      summary: {
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        commissionRate: commissionRate,
        totalCommission: totalCommission,
        netRevenue: netRevenue
      },
      breakdown: {
        orderStatus: orderBreakdown,
        monthly: monthlyBreakdown
      },
      generatedAt: new Date()
    };

    res.json(invoice);
  } catch (error) {
    console.error('Commission invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStoreOverview,
  getStoreCustomers,
  getStoreOrders,
  getStoreRevenueTrends,
  getStoreActivityLogs,
  getStoreCommissionInvoice
};





