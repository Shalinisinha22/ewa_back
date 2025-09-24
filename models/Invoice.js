const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [invoiceItemSchema],
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
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'sent'
  },
  dueDate: {
    type: Date,
    default: function() {
      // Set due date to 30 days from invoice date
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  notes: {
    customer: String,
    internal: String
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    template: {
      type: String,
      default: 'default'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
invoiceSchema.index({ storeId: 1, status: 1 });
invoiceSchema.index({ storeId: 1, customer: 1 });
invoiceSchema.index({ storeId: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments({ storeId: this.storeId });
    this.invoiceNumber = `INV-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for invoice total items
invoiceSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate totals
invoiceSchema.methods.calculateTotals = function() {
  this.pricing.subtotal = this.items.reduce((total, item) => {
    return total + (item.unitPrice * item.quantity);
  }, 0);
  
  this.pricing.total = this.pricing.subtotal + this.pricing.tax + this.pricing.shipping - this.pricing.discount;
  this.payment.amount = this.pricing.total;
};

// Method to get formatted invoice data
invoiceSchema.methods.getFormattedData = function() {
  return {
    invoiceNumber: this.invoiceNumber,
    orderNumber: this.orderId.orderNumber,
    issueDate: this.createdAt.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    dueDate: this.dueDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    billing: this.billing,
    shipping: this.shipping,
    items: this.items,
    pricing: this.pricing,
    payment: this.payment,
    status: this.status,
    notes: this.notes
  };
};

module.exports = mongoose.model('Invoice', invoiceSchema);