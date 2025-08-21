const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subtitle: {
    type: String,
    maxlength: [300, 'Subtitle cannot exceed 300 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Banner image is required']
  },
  mobileImage: {
    type: String
  },
  link: {
    url: String,
    text: String,
    target: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self'
    }
  },
  position: {
    type: String,
    required: [true, 'Banner position is required'],
    enum: ['hero', 'sidebar', 'popup', 'header', 'footer', 'category', 'product']
  },
  placement: {
    page: {
      type: String,
      enum: ['home', 'category', 'product', 'cart', 'checkout', 'all'],
      default: 'home'
    },
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  display: {
    startDate: Date,
    endDate: Date,
    schedule: {
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      startTime: String,
      endTime: String
    }
  },
  targeting: {
    devices: [{
      type: String,
      enum: ['desktop', 'tablet', 'mobile']
    }],
    userTypes: [{
      type: String,
      enum: ['new', 'returning', 'logged_in', 'guest']
    }],
    countries: [String],
    minOrderValue: Number
  },
  style: {
    backgroundColor: String,
    textColor: String,
    buttonColor: String,
    buttonTextColor: String,
    borderRadius: Number,
    padding: String,
    margin: String,
    customCSS: String
  },
  animation: {
    type: {
      type: String,
      enum: ['none', 'fade', 'slide', 'zoom', 'bounce'],
      default: 'none'
    },
    duration: {
      type: Number,
      default: 500
    },
    delay: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled'],
    default: 'active'
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bannerSchema.index({ storeId: 1, status: 1 });
bannerSchema.index({ storeId: 1, position: 1 });
bannerSchema.index({ storeId: 1, 'placement.page': 1 });
bannerSchema.index({ storeId: 1, priority: -1 });

// Virtual for click-through rate
bannerSchema.virtual('ctr').get(function() {
  if (this.analytics.impressions === 0) return 0;
  return ((this.analytics.clicks / this.analytics.impressions) * 100).toFixed(2);
});

// Virtual for conversion rate
bannerSchema.virtual('conversionRate').get(function() {
  if (this.analytics.clicks === 0) return 0;
  return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2);
});

// Method to check if banner should be displayed
bannerSchema.methods.shouldDisplay = function(context = {}) {
  const now = new Date();
  
  // Check status
  if (this.status !== 'active') return false;
  
  // Check date range
  if (this.display.startDate && now < this.display.startDate) return false;
  if (this.display.endDate && now > this.display.endDate) return false;
  
  // Check schedule
  if (this.display.schedule.days && this.display.schedule.days.length > 0) {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
    if (!this.display.schedule.days.includes(currentDay)) return false;
  }
  
  if (this.display.schedule.startTime && this.display.schedule.endTime) {
    const currentTime = now.toTimeString().slice(0, 5);
    if (currentTime < this.display.schedule.startTime || currentTime > this.display.schedule.endTime) {
      return false;
    }
  }
  
  // Check targeting
  if (context.device && this.targeting.devices.length > 0) {
    if (!this.targeting.devices.includes(context.device)) return false;
  }
  
  if (context.userType && this.targeting.userTypes.length > 0) {
    if (!this.targeting.userTypes.includes(context.userType)) return false;
  }
  
  if (context.country && this.targeting.countries.length > 0) {
    if (!this.targeting.countries.includes(context.country)) return false;
  }
  
  return true;
};

// Method to record impression
bannerSchema.methods.recordImpression = function() {
  this.analytics.impressions += 1;
  return this.save();
};

// Method to record click
bannerSchema.methods.recordClick = function() {
  this.analytics.clicks += 1;
  return this.save();
};

// Method to record conversion
bannerSchema.methods.recordConversion = function() {
  this.analytics.conversions += 1;
  return this.save();
};

module.exports = mongoose.model('Banner', bannerSchema);