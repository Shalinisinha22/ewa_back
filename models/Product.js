const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  sku: {
    type: String,
    uppercase: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  oldPrice: {
    type: Number,
    min: [0, 'Old price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true
  },
  images: [{
    type: String
  }],
  videos: [{
    type: String
  }],
  stock: {
    quantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackQuantity: {
      type: Boolean,
      default: true
    }
  },
  variants: [{
    name: String,
    value: String,
    price: Number,
    stock: Number,
    sku: String,
    image: String
  }],
  attributes: {
    color: String,
    size: [String],
    material: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'out_of_stock'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  tags: [String],
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: { type: Boolean, default: false },
    shippingClass: String
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'public'
  },
  publishedAt: Date,
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ storeId: 1, category: 1 });
productSchema.index({ storeId: 1, featured: 1 });
productSchema.index({ storeId: 1, isNewArrival: 1 });
productSchema.index({ storeId: 1, isTrending: 1 });
productSchema.index({ storeId: 1, 'stock.quantity': 1 });
productSchema.index({ slug: 1, storeId: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

// Text search index
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text'
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice && this.discountPrice > 0 ? this.discountPrice : this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice && this.discountPrice > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.stock.trackQuantity) return 'in_stock';
  if (this.stock.quantity <= 0) return 'out_of_stock';
  if (this.stock.quantity <= this.stock.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  console.log('Product pre-save - Images before:', this.images);
  console.log('Product pre-save - Videos before:', this.videos);
  
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set published date
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  console.log('Product pre-save - Images after:', this.images);
  console.log('Product pre-save - Videos after:', this.videos);
  
  next();
});

module.exports = mongoose.model('Product', productSchema);