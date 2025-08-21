const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Store slug is required'],
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  logo: {
    type: String
  },
  favicon: {
    type: String
  },
  domain: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    currency: {
      type: String,
      default: 'INR'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      primaryColor: { type: String, default: '#c30001' },
      secondaryColor: { type: String, default: '#292929' }
    }
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
    linkedin: String
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
storeSchema.index({ slug: 1 });
storeSchema.index({ domain: 1 });
storeSchema.index({ status: 1 });

module.exports = mongoose.model('Store', storeSchema);