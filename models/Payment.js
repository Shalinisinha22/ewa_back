const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  name: {
    type: String,
    required: [true, 'Gateway name is required'],
    trim: true,
    enum: ['Razorpay', 'Stripe', 'PayU', 'Cash on Delivery', 'PayPal']
  },
  isActive: {
    type: Boolean,
    default: false
  },
  credentials: {
    // Razorpay
    keyId: String,
    keySecret: String,
    webhookSecret: String,
    
    // Stripe
    publishableKey: String,
    secretKey: String,
    
    // PayU
    merchantId: String,
    merchantKey: String,
    salt: String,
    
    // Cash on Delivery
    maxAmount: {
      type: Number,
      default: 5000
    },
    charges: {
      type: Number,
      default: 25
    },
    
    // PayPal
    clientId: String,
    clientSecret: String,
    mode: {
      type: String,
      enum: ['sandbox', 'live'],
      default: 'sandbox'
    }
  },
  testMode: {
    type: Boolean,
    default: true
  },
  description: String
}, {
  timestamps: true
});

// Index for efficient queries
paymentGatewaySchema.index({ storeId: 1 });
paymentGatewaySchema.index({ storeId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
