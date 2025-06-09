const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel.js');

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = status;

    // If status is delivered, update isDelivered
    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address,
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const count = await Order.countDocuments({});
  const orders = await Order.find({})
    .populate('user', 'id name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ orders, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get order statistics
// @route   GET /api/orders/statistics
// @access  Private/Admin
const getOrderStatistics = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments({});
  const pendingOrders = await Order.countDocuments({ status: 'Pending' });
  const processingOrders = await Order.countDocuments({ status: 'Processing' });
  const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
  const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

  // Total revenue
  const orders = await Order.find({ isPaid: true });
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  // Last 7 days orders
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last7DaysOrders = await Order.countDocuments({
    createdAt: { $gte: last7Days },
  });

  res.json({
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    last7DaysOrders,
  });
});

module.exports = {
  getOrderById,
  updateOrderStatus,
  updateOrderToPaid,
  getOrders,
  getOrderStatistics
};