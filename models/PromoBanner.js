const mongoose = require('mongoose');

const promoBannerSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']

  },
  
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    trim: true
  },
  
  order: {
    type: Number,
    default: 0,
    min: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  link: {
    url: {
      type: String,
      trim: true
    },
    text: {
      type: String,
      trim: true
    },
    target: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self'
    }
  },
  
  style: {
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    textColor: {
      type: String,
      default: '#000000'
    },
    iconColor: {
      type: String,
      default: '#3b82f6'
    },
    hoverColor: {
      type: String,
      default: '#1d4ed8'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
promoBannerSchema.index({ storeId: 1, isActive: 1, order: 1 });

// Virtual for formatted icon
promoBannerSchema.virtual('formattedIcon').get(function() {
  // If it's already a RemixIcon class, return as is
  if (this.icon.startsWith('ri-')) {
    return this.icon;
  }
  // Otherwise, assume it's an icon name and format it
  return `ri-${this.icon}-line`;
});

module.exports = mongoose.model('PromoBanner', promoBannerSchema);
