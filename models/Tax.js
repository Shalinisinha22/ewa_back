const mongoose = require('mongoose');

const taxSettingsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  name: {
    type: String,
    required: [true, 'Tax name is required'],
    trim: true
  },
  rate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
taxSettingsSchema.index({ storeId: 1 });
taxSettingsSchema.index({ storeId: 1, isActive: 1 });

module.exports = mongoose.model('TaxSettings', taxSettingsSchema);
