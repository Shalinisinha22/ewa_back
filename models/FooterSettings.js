const mongoose = require('mongoose');

const footerSettingsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  contactInfo: {
    address: {
      type: String,
      required: true,
      default: 'Kankarbagh, Patna, Bihar'
    },
    email: {
      type: String,
      required: true,
      default: 'support@ewa.com'
    },
    phone: {
      type: String,
      required: true,
      default: '(+91) 9999999999'
    }
  },
  socialLinks: {
    facebook: {
      type: String,
      default: ''
    },
    instagram: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    },
    pinterest: {
      type: String,
      default: ''
    },
    youtube: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    }
  },
  mapSettings: {
    embedCode: {
      type: String,
      default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.8974!2d85.1376!3d25.5941!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f29937c52d4f05%3A0x831a0e05f607b270!2sKankarbagh%2C%20Patna%2C%20Bihar!5e0!3m2!1sen!2sin!4v1635000000000!5m2!1sen!2sin'
    },
    showMap: {
      type: Boolean,
      default: true
    }
  },
  copyright: {
    text: {
      type: String,
      default: 'Copyright © 2025 EWA. All rights reserved.'
    },
    year: {
      type: Number,
      default: new Date().getFullYear()
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Ensure only one footer settings per store
footerSettingsSchema.index({ storeId: 1 }, { unique: true });

// Pre-save middleware to update copyright year
footerSettingsSchema.pre('save', function(next) {
  if (this.copyright && !this.copyright.year) {
    this.copyright.year = new Date().getFullYear();
  }
  next();
});

module.exports = mongoose.model('FooterSettings', footerSettingsSchema);

