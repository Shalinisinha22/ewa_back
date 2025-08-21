const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: {
    name: String,
    value: String
  }
});

const orderSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [orderItemSchema],
  billing: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true }
    }
  },
  shipping: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: {
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true }
    },
    method: String,
    cost: { type: Number, default: 0 }
  },
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'paypal', 'razorpay', 'stripe', 'cod']
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    amount: { type: Number, required: true }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  coupon: {
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  fulfillment: {
    status: {
      type: String,
      enum: ['unfulfilled', 'partial', 'fulfilled'],
      default: 'unfulfilled'
    },
    shippedAt: Date,
    deliveredAt: Date,
    trackingNumber: String,
    carrier: String
  },
  notes: {
    customer: String,
    internal: String
  },
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    transactionId: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ storeId: 1, customer: 1 });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ 'payment.status': 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments({ storeId: this.storeId });
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for order total items
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.pricing.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Apply coupon discount
  if (this.coupon && this.coupon.discount) {
    if (this.coupon.type === 'percentage') {
      this.pricing.discount = (this.pricing.subtotal * this.coupon.discount) / 100;
    } else {
      this.pricing.discount = this.coupon.discount;
    }
  }
  
  this.pricing.total = this.pricing.subtotal + this.pricing.tax + this.pricing.shipping - this.pricing.discount;
  this.payment.amount = this.pricing.total;
};

module.exports = mongoose.model('Order', orderSchema);