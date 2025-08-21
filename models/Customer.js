const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters']
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  avatar: String,
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'both'
    },
    firstName: String,
    lastName: String,
    company: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  preferences: {
    newsletter: { type: Boolean, default: true },
    smsMarketing: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'INR' }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  orderStats: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    lastOrderDate: Date
  },
  tags: [String],
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries
customerSchema.index({ storeId: 1, email: 1 }, { unique: true });
customerSchema.index({ storeId: 1, status: 1 });
customerSchema.index({ storeId: 1, createdAt: -1 });
customerSchema.index({ storeId: 1, 'orderStats.totalSpent': -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
customerSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update login stats
customerSchema.methods.updateLoginStats = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Update order stats
customerSchema.methods.updateOrderStats = async function() {
  const Order = mongoose.model('Order');
  const stats = await Order.aggregate([
    { $match: { customer: this._id, status: { $in: ['delivered', 'completed'] } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' },
        lastOrderDate: { $max: '$createdAt' }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.orderStats.totalOrders = stats[0].totalOrders;
    this.orderStats.totalSpent = stats[0].totalSpent;
    this.orderStats.averageOrderValue = stats[0].totalSpent / stats[0].totalOrders;
    this.orderStats.lastOrderDate = stats[0].lastOrderDate;
  }
  
  return this.save();
};

// Remove password from JSON output
customerSchema.methods.toJSON = function() {
  const customer = this.toObject();
  delete customer.password;
  return customer;
};

module.exports = mongoose.model('Customer', customerSchema);