const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const storeId = req.storeId;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          todayOrders: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] }
          },
          todayRevenue: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$pricing.total', 0] }
          },
          weekOrders: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, 1, 0] }
          },
          weekRevenue: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, '$pricing.total', 0] }
          },
          monthOrders: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisMonth] }, 1, 0] }
          },
          monthRevenue: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisMonth] }, '$pricing.total', 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get product statistics
    const productStats = await Product.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get customer statistics
    const customerStats = await Customer.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          newCustomersToday: {
            $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] }
          },
          newCustomersWeek: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisWeek] }, 1, 0] }
          },
          newCustomersMonth: {
            $sum: { $cond: [{ $gte: ['$createdAt', thisMonth] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ storeId })
      .populate('customer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber customer pricing.total status createdAt');

    // Get low stock products
    const lowStockProducts = await Product.find({
      storeId,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
      .sort({ 'stock.quantity': 1 })
      .limit(5)
      .select('name stock.quantity stock.lowStockThreshold');

    res.json({
      orders: orderStats[0] || {},
      products: productStats[0] || {},
      customers: customerStats[0] || {},
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const storeId = req.storeId;

    let matchQuery = { storeId: new mongoose.Types.ObjectId(storeId) };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    let groupId;
    switch (groupBy) {
      case 'hour':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        };
        break;
      case 'day':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupId = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          totalSales: { $sum: '$pricing.total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product report
// @route   GET /api/reports/products
// @access  Private
const getProductReport = async (req, res) => {
  try {
    const storeId = req.storeId;

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          productName: { $first: '$items.name' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Category performance
    const categoryPerformance = await Order.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({
      storeId,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ 'stock.quantity': 1 })
      .select('name stock category');

    res.json({
      topProducts,
      categoryPerformance,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer report
// @route   GET /api/reports/customers
// @access  Private
const getCustomerReport = async (req, res) => {
  try {
    const storeId = req.storeId;

    // Top customers by spending
    const topCustomers = await Customer.find({
      storeId,
      'orderStats.totalSpent': { $gt: 0 }
    })
      .sort({ 'orderStats.totalSpent': -1 })
      .limit(10)
      .select('firstName lastName email orderStats');

    // Customer acquisition trend
    const acquisitionTrend = await Customer.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          newCustomers: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Customer lifetime value distribution
    const lifetimeValueDistribution = await Customer.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $bucket: {
          groupBy: '$orderStats.totalSpent',
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalSpent: { $sum: '$orderStats.totalSpent' }
          }
        }
      }
    ]);

    res.json({
      topCustomers,
      acquisitionTrend,
      lifetimeValueDistribution
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order report
// @route   GET /api/reports/orders
// @access  Private
const getOrderReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.storeId;

    let matchQuery = { storeId: new mongoose.Types.ObjectId(storeId) };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Order status distribution
    const statusDistribution = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    // Payment method distribution
    const paymentMethodDistribution = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$payment.method',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.total' }
        }
      }
    ]);

    // Average order value trend
    const aovTrend = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageOrderValue: { $avg: '$pricing.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      statusDistribution,
      paymentMethodDistribution,
      aovTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue report
// @route   GET /api/reports/revenue
// @access  Private
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const storeId = req.storeId;

    let matchQuery = { 
      storeId: new mongoose.Types.ObjectId(storeId),
      status: { $in: ['delivered', 'completed'] }
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    let groupId;
    switch (groupBy) {
      case 'day':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupId = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      case 'year':
        groupId = { year: { $year: '$createdAt' } };
        break;
      default:
        groupId = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    const revenueData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupId,
          grossRevenue: { $sum: '$pricing.total' },
          netRevenue: { $sum: { $subtract: ['$pricing.total', '$pricing.tax', '$pricing.shipping'] } },
          taxCollected: { $sum: '$pricing.tax' },
          shippingRevenue: { $sum: '$pricing.shipping' },
          discountsGiven: { $sum: '$pricing.discount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = async (req, res) => {
  try {
    const storeId = req.storeId;

    // Inventory summary
    const inventorySummary = await Product.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ['$stock.quantity', '$price'] } },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] },
                1,
                0
              ]
            }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$stock.quantity', 0] }, 1, 0] }
          }
        }
      }
    ]);

    // Stock levels by category
    const stockByCategory = await Product.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.name' },
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock.quantity' },
          stockValue: { $sum: { $multiply: ['$stock.quantity', '$price'] } }
        }
      },
      { $sort: { stockValue: -1 } }
    ]);

    // Products needing restock
    const restockNeeded = await Product.find({
      storeId,
      $expr: { $lte: ['$stock.quantity', '$stock.lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ 'stock.quantity': 1 })
      .select('name stock price category');

    res.json({
      summary: inventorySummary[0] || {},
      stockByCategory,
      restockNeeded
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export report data
// @route   POST /api/reports/export
// @access  Private
const exportReport = async (req, res) => {
  try {
    const { reportType, format = 'json', ...filters } = req.body;

    let data;
    switch (reportType) {
      case 'sales':
        data = await getSalesReportData(req.storeId, filters);
        break;
      case 'products':
        data = await getProductReportData(req.storeId, filters);
        break;
      case 'customers':
        data = await getCustomerReportData(req.storeId, filters);
        break;
      case 'orders':
        data = await getOrderReportData(req.storeId, filters);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // For now, return JSON. In a real app, you might convert to CSV, Excel, etc.
    res.json({
      reportType,
      generatedAt: new Date(),
      data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions for export
const getSalesReportData = async (storeId, filters) => {
  // Implementation for sales report export
  return await Order.find({ storeId }).populate('customer', 'firstName lastName email');
};

const getProductReportData = async (storeId, filters) => {
  // Implementation for product report export
  return await Product.find({ storeId }).populate('category', 'name');
};

const getCustomerReportData = async (storeId, filters) => {
  // Implementation for customer report export
  return await Customer.find({ storeId });
};

const getOrderReportData = async (storeId, filters) => {
  // Implementation for order report export
  return await Order.find({ storeId }).populate('customer', 'firstName lastName email');
};

module.exports = {
  getDashboardStats,
  getSalesReport,
  getProductReport,
  getCustomerReport,
  getOrderReport,
  getRevenueReport,
  getInventoryReport,
  exportReport
};