const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: [true, 'Store ID is required']
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Page slug is required'],
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Page content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  featuredImage: {
    type: String
  },
  template: {
    type: String,
    enum: ['default', 'full-width', 'sidebar-left', 'sidebar-right', 'landing'],
    default: 'default'
  },
  type: {
    type: String,
    enum: ['page', 'policy', 'help', 'about', 'contact'],
    default: 'page'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'private'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'public'
  },
  password: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    canonicalUrl: String,
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false }
  },
  navigation: {
    showInMenu: { type: Boolean, default: false },
    menuOrder: { type: Number, default: 0 },
    parentPage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page'
    }
  },
  settings: {
    allowComments: { type: Boolean, default: false },
    showTitle: { type: Boolean, default: true },
    showDate: { type: Boolean, default: false },
    showAuthor: { type: Boolean, default: false }
  },
  customFields: [{
    key: String,
    value: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['text', 'textarea', 'number', 'boolean', 'date', 'url', 'email']
    }
  }],
  publishedAt: Date,
  scheduledAt: Date,
  views: {
    type: Number,
    default: 0
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pageSchema.index({ storeId: 1, status: 1 });
pageSchema.index({ storeId: 1, type: 1 });
pageSchema.index({ slug: 1, storeId: 1 }, { unique: true });
pageSchema.index({ storeId: 1, 'navigation.showInMenu': 1, 'navigation.menuOrder': 1 });

// Text search index
pageSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text'
});

// Pre-save middleware
pageSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Set published date
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate SEO meta if not provided
  if (!this.seo.metaTitle && this.title) {
    this.seo.metaTitle = this.title;
  }
  
  if (!this.seo.metaDescription && this.excerpt) {
    this.seo.metaDescription = this.excerpt;
  }
  
  next();
});

// Method to increment views
pageSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to get children pages
pageSchema.methods.getChildren = function() {
  return this.constructor.find({
    storeId: this.storeId,
    'navigation.parentPage': this._id,
    status: 'published'
  }).sort({ 'navigation.menuOrder': 1, title: 1 });
};

// Virtual for reading time (assuming 200 words per minute)
pageSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
});

// Virtual for word count
pageSchema.virtual('wordCount').get(function() {
  return this.content.split(/\s+/).length;
});

module.exports = mongoose.model('Page', pageSchema);