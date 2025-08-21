const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
categorySchema.index({ storeId: 1, status: 1 });
categorySchema.index({ storeId: 1, parent: 1 });
categorySchema.index({ slug: 1, storeId: 1 }, { unique: true });
categorySchema.index({ storeId: 1, level: 1 });

// Pre-save middleware
categorySchema.pre('save', async function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set level and path based on parent
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
      this.path = parent.path ? `${parent.path}/${parent._id}` : `${parent._id}`;
    }
  } else {
    this.level = 0;
    this.path = '';
  }
  
  next();
});

// Method to get all children
categorySchema.methods.getChildren = function() {
  return this.constructor.find({ 
    storeId: this.storeId,
    parent: this._id,
    status: 'active'
  }).sort({ sortOrder: 1, name: 1 });
};

// Method to get all descendants
categorySchema.methods.getDescendants = function() {
  const pathRegex = new RegExp(`^${this.path}/${this._id}`);
  return this.constructor.find({
    storeId: this.storeId,
    path: pathRegex,
    status: 'active'
  }).sort({ level: 1, sortOrder: 1, name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);