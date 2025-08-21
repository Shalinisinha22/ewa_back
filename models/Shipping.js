const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true
  },
  minWeight: {
    type: Number,
    default: 0,
    min: 0
  },
  maxWeight: {
    type: Number,
    required: [true, 'Max weight is required'],
    min: 0
  },
  rate: {
    type: Number,
    required: [true, 'Shipping rate is required'],
    min: 0
  },
  estimatedDays: {
    type: String,
    required: [true, 'Estimated delivery days is required']
  },
  codAvailable: {
    type: Boolean,
    default: false
  },
  codCharges: {
    type: Number,
    default: 0,
    min: 0
  }
});

const shippingSettingsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  freeShippingThreshold: {
    type: Number,
    default: 500,
    min: 0
  },
  defaultShippingCost: {
    type: Number,
    default: 50,
    min: 0
  },
  zones: [shippingZoneSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
shippingSettingsSchema.index({ storeId: 1 });

module.exports = mongoose.model('ShippingSettings', shippingSettingsSchema);
