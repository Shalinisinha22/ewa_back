const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private
const getCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.search) {
      query.$or = [
        { code: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Type filter
    if (req.query.type) {
      query.type = req.query.type;
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Private
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      storeId: req.storeId
    })
      .populate('conditions.applicableProducts', 'name')
      .populate('conditions.applicableCategories', 'name')
      .populate('conditions.excludeProducts', 'name')
      .populate('conditions.excludeCategories', 'name');

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create coupon
// @route   POST /api/coupons
// @access  Private
const createCoupon = async (req, res) => {
  try {
    const couponData = {
      ...req.body,
      storeId: req.storeId
    };

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
      code: couponData.code,
      storeId: req.storeId
    });

    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create(couponData);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check code uniqueness if code is being updated
    if (req.body.code && req.body.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: req.body.code,
        storeId: req.storeId,
        _id: { $ne: req.params.id }
      });

      if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
    }

    Object.assign(coupon, req.body);
    const updatedCoupon = await coupon.save();

    res.json(updatedCoupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if coupon has been used
    if (coupon.usage.used > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete coupon that has been used. Consider deactivating instead.' 
      });
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const { code, customerId, subtotal, items } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      storeId: req.storeId
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Check if coupon is valid
    const validation = coupon.isValid(customerId);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.reason });
    }

    // Check minimum order amount
    if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
      return res.status(400).json({ 
        message: `Minimum order amount of ₹${coupon.minimumAmount} required` 
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(subtotal, items);

    res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value
      },
      discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply coupon
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res) => {
  try {
    const { couponId, customerId, orderId, discountAmount } = req.body;

    const coupon = await Coupon.findOne({
      _id: couponId,
      storeId: req.storeId
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    // Record usage
    await coupon.recordUsage(customerId, orderId, discountAmount);

    res.json({ message: 'Coupon applied successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get coupon statistics
// @route   GET /api/coupons/stats
// @access  Private
const getCouponStats = async (req, res) => {
  try {
    const stats = await Coupon.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: null,
          totalCoupons: { $sum: 1 },
          activeCoupons: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          expiredCoupons: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          totalUsage: { $sum: '$usage.used' },
          totalDiscountGiven: {
            $sum: {
              $reduce: {
                input: '$usageHistory',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.discountAmount'] }
              }
            }
          }
        }
      }
    ]);

    // Get coupon performance
    const topCoupons = await Coupon.find({
      storeId: req.storeId,
      'usage.used': { $gt: 0 }
    })
      .sort({ 'usage.used': -1 })
      .limit(10)
      .select('code name type value usage.used');

    res.json({
      overview: stats[0] || {
        totalCoupons: 0,
        activeCoupons: 0,
        expiredCoupons: 0,
        totalUsage: 0,
        totalDiscountGiven: 0
      },
      topCoupons
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon usage history
// @route   GET /api/coupons/:id/usage
// @access  Private
const getCouponUsage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const coupon = await Coupon.findOne({
      _id: req.params.id,
      storeId: req.storeId
    })
      .populate({
        path: 'usageHistory.customer',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'usageHistory.order',
        select: 'orderNumber pricing.total'
      });

    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const usage = coupon.usageHistory
      .sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
      .slice(skip, skip + limit);

    const total = coupon.usageHistory.length;

    res.json({
      usage,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats,
  getCouponUsage
};