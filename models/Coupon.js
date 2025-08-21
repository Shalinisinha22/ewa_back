const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    uppercase: true,
    trim: true,
    maxlength: [50, 'Coupon code cannot exceed 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true,
    maxlength: [100, 'Coupon name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Coupon type is required'],
    enum: ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y']
  },
  value: {
    type: Number,
    required: [true, 'Coupon value is required'],
    min: [0, 'Coupon value cannot be negative']
  },
  minimumAmount: {
    type: Number,
    min: [0, 'Minimum amount cannot be negative'],
    default: 0
  },
  maximumDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  usage: {
    limit: {
      type: Number,
      min: [1, 'Usage limit must be at least 1']
    },
    limitPerCustomer: {
      type: Number,
      min: [1, 'Usage limit per customer must be at least 1']
    },
    used: {
      type: Number,
      default: 0
    }
  },
  validity: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  conditions: {
    applicableProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    applicableCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    excludeProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    excludeCategories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    customerGroups: [String],
    firstTimeCustomer: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  usageHistory: [{
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    discountAmount: Number,
    usedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
couponSchema.index({ storeId: 1, code: 1 }, { unique: true });
couponSchema.index({ storeId: 1, status: 1 });
couponSchema.index({ storeId: 1, 'validity.startDate': 1, 'validity.endDate': 1 });

// Virtual for usage percentage
couponSchema.virtual('usagePercentage').get(function() {
  if (!this.usage.limit) return 0;
  return Math.round((this.usage.used / this.usage.limit) * 100);
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usage.limit) return Infinity;
  return Math.max(0, this.usage.limit - this.usage.used);
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function(customerId = null) {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') return { valid: false, reason: 'Coupon is not active' };
  
  // Check date validity
  if (now < this.validity.startDate) return { valid: false, reason: 'Coupon is not yet active' };
  if (now > this.validity.endDate) return { valid: false, reason: 'Coupon has expired' };
  
  // Check usage limit
  if (this.usage.limit && this.usage.used >= this.usage.limit) {
    return { valid: false, reason: 'Coupon usage limit exceeded' };
  }
  
  // Check per customer limit
  if (customerId && this.usage.limitPerCustomer) {
    const customerUsage = this.usageHistory.filter(
      usage => usage.customer.toString() === customerId.toString()
    ).length;
    
    if (customerUsage >= this.usage.limitPerCustomer) {
      return { valid: false, reason: 'Customer usage limit exceeded' };
    }
  }
  
  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(subtotal, items = []) {
  let discount = 0;
  
  switch (this.type) {
    case 'percentage':
      discount = (subtotal * this.value) / 100;
      if (this.maximumDiscount && discount > this.maximumDiscount) {
        discount = this.maximumDiscount;
      }
      break;
      
    case 'fixed':
      discount = Math.min(this.value, subtotal);
      break;
      
    case 'free_shipping':
      // This would be handled in shipping calculation
      discount = 0;
      break;
      
    case 'buy_x_get_y':
      // Complex logic for buy X get Y offers
      // This would need to be implemented based on specific requirements
      discount = 0;
      break;
  }
  
  return Math.max(0, discount);
};

// Method to record usage
couponSchema.methods.recordUsage = function(customerId, orderId, discountAmount) {
  this.usage.used += 1;
  this.usageHistory.push({
    customer: customerId,
    order: orderId,
    discountAmount: discountAmount,
    usedAt: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);