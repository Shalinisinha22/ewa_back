const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Payment status filter
    if (req.query.paymentStatus) {
      query['payment.status'] = req.query.paymentStatus;
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

    // Search by order number or customer
    if (req.query.search) {
      const customers = await Customer.find({
        storeId: req.storeId,
        $or: [
          { firstName: { $regex: req.query.search, $options: 'i' } },
          { lastName: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { customer: { $in: customers.map(c => c._id) } }
      ];
    }

    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

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

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.storeId
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Update fulfillment status based on order status
    switch (status) {
      case 'shipped':
        order.fulfillment.status = 'fulfilled';
        order.fulfillment.shippedAt = new Date();
        break;
      case 'delivered':
        order.fulfillment.status = 'fulfilled';
        order.fulfillment.deliveredAt = new Date();
        break;
      case 'cancelled':
        // Restore stock if order was not previously cancelled
        if (oldStatus !== 'cancelled') {
          for (let item of order.items) {
            const product = await Product.findById(item.product);
            if (product && product.stock.trackQuantity) {
              product.stock.quantity += item.quantity;
              await product.save();
            }
          }
        }
        break;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mark order as paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.payment.status = 'completed';
    order.payment.paidAt = new Date();
    order.payment.transactionId = req.body.id || `TXN-${Date.now()}`;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
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

    res.json(stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    // Map payment method to valid enum value
    const paymentMethodMapping = {
      'Cash on Delivery': 'cod',
      'Credit Card': 'credit_card',
      'Debit Card': 'debit_card',
      'PayPal': 'paypal',
      'Razorpay': 'razorpay',
      'Stripe': 'stripe'
    };

    const orderData = {
      ...req.body,
      storeId: req.storeId
    };

    // Map payment method if it exists
    if (orderData.payment && orderData.payment.method) {
      orderData.payment = {
        ...orderData.payment,
        method: paymentMethodMapping[orderData.payment.method] || orderData.payment.method
      };
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, storeId: req.storeId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      storeId: req.storeId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export orders
// @route   GET /api/orders/export
// @access  Private
const exportOrders = async (req, res) => {
  try {
    const orders = await Order.find({ storeId: req.storeId })
      .populate('customer', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refund order
// @route   POST /api/orders/:id/refund
// @access  Private
const refundOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be refunded
    if (order.status === 'refunded') {
      return res.status(400).json({ message: 'Order is already refunded' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot refund cancelled order' });
    }

    const { 
      refundReason, 
      refundAmount, 
      transactionId,
      bankDetails = {}
    } = req.body;

    // Try to get bank details from request or from customer
    let { accountHolderName, bankName, accountNumber, ifscCode, upiId } = bankDetails;
    
    // If no bank details provided and order has customer info, try to get from customer
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      try {
        const Customer = require('../models/Customer');
        const customer = await Customer.findById(order.customer);
        
        if (customer && customer.bankDetails && customer.bankDetails.length > 0) {
          const defaultBankDetails = customer.bankDetails.find(bank => bank.isDefault) || customer.bankDetails[0];
          accountHolderName = accountHolderName || defaultBankDetails.accountHolderName;
          bankName = bankName || defaultBankDetails.bankName;
          accountNumber = accountNumber || defaultBankDetails.accountNumber;
          ifscCode = ifscCode || defaultBankDetails.ifscCode;
          upiId = upiId || defaultBankDetails.upiId;
        }
      } catch (error) {
        console.error('Error fetching customer bank details:', error);
      }
    }

    // Validate that we have required bank details
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ 
        message: 'Bank details are required for refund processing. Please provide account holder name, bank name, account number, and IFSC code.' 
      });
    }
    
    // Set refund information - update to refund_completed status
    order.status = 'refund_completed';
    order.payment.status = 'refunded';
    order.refund = {
      amount: refundAmount || order.pricing.total,
      reason: refundReason || 'Admin refund',
      refundedAt: new Date(),
      transactionId: transactionId || `REF-${Date.now()}`
    };

    // Add refund processing notes with bank details
    if (!order.notes) order.notes = {};
    order.notes.internal = `Refund processed with bank details: ${accountHolderName} - ${bankName} (${accountNumber}) at ${new Date().toISOString()}`;
    if (upiId) {
      order.notes.internal += ` | UPI ID: ${upiId}`;
    }

    // Restore stock if refunding items
    try {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.stock && product.stock.trackQuantity) {
          product.stock.quantity += item.quantity;
          await product.save();
        }
      }
    } catch (stockError) {
      console.error('Error restoring stock during refund:', stockError);
      // Don't fail the refund if stock restoration fails
    }
    
    const updatedOrder = await order.save();
    res.json({
      message: 'Order refunded successfully',
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot cancel delivered order. Consider processing a refund instead.' });
    }

    const { reason } = req.body;
    
    order.status = 'cancelled';
    
    // If payment was completed, mark it as cancelled
    if (order.payment.status === 'completed') {
      order.payment.status = 'cancelled';
    }

    // Add cancellation reason
    if (reason) {
      if (!order.notes) order.notes = {};
      order.notes.internal = `Cancelled by admin: ${reason}`;
    }

    // Restore stock if items were reduced at checkout
    try {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product && product.stock && product.stock.trackQuantity) {
          product.stock.quantity += item.quantity;
          await product.save();
        }
      }
    } catch (stockError) {
      console.error('Error restoring stock during cancellation:', stockError);
      // Don't fail the cancellation if stock restoration fails
    }
    
    const updatedOrder = await order.save();
    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  markOrderAsPaid,
  getOrderStats,
  exportOrders,
  refundOrder,
  cancelOrder
};