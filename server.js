const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/config');
const fs = require('fs'); // Added for file system operations

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const storeRoutes = require('./routes/storeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const couponRoutes = require('./routes/couponRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const pageRoutes = require('./routes/pageRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingRoutes = require('./routes/settingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// Set server timeout for video uploads
app.use((req, res, next) => {
  // Set timeout to 5 minutes for video upload routes
  if (req.path.includes('/upload/video') || req.path.includes('/upload/videos')) {
    req.setTimeout(300000); // 5 minutes
    res.setTimeout(300000); // 5 minutes
  }
  next();
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    // Skip rate limiting for public routes and health checks
    return req.path.includes('/api/health') || 
           req.path.includes('/api/test') || 
           req.path.includes('/api/test-db') ||
           req.path.includes('/public');
  }
});
app.use('/api/', limiter);


// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://ewa-luxe.vercel.app',
  'https://ewaluxe-admin.vercel.app/',
  'https://ewa-back.vercel.app',
  'https://ewa-luxe-git-main-shalini-s-projects.vercel.app',
  'https://ewa-luxe-shalini-s-projects.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Store-ID']
}));

// Body parsing middleware - increased limit for video uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from uploads directory with proper CORS headers
app.use('/uploads', (req, res, next) => {
  // Allow all origins for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  
  // Debug CORS requests
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
    next();
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EWA Fashion API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });
});

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Test route is working',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    headers: req.headers
  });
});

// Database test route
app.get('/api/test-db', async (req, res) => {
  try {
    const Store = require('./models/Store');
    const store = await Store.findOne({ status: 'active' });
    res.status(200).json({
      status: 'OK',
      message: 'Database connection is working',
      store: store ? { id: store._id, name: store.name, slug: store.slug } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Banner test route
app.get('/api/test-banners', async (req, res) => {
  try {
    const Banner = require('./models/Banner');
    const Store = require('./models/Store');
    
    // Get all stores
    const stores = await Store.find({ status: 'active' });
    
    // Get all banners
    const allBanners = await Banner.find({});
    
    // Get banners for specific store if provided
    let storeBanners = [];
    if (req.query.store) {
      const store = await Store.findOne({
        $or: [
          { name: req.query.store },
          { slug: req.query.store }
        ],
        status: 'active'
      });
      
      if (store) {
        storeBanners = await Banner.find({ storeId: store._id });
      }
    }
    
    res.status(200).json({
      status: 'OK',
      message: 'Banner test completed',
      totalBanners: allBanners.length,
      totalStores: stores.length,
      stores: stores.map(s => ({ id: s._id, name: s.name, slug: s.slug })),
      allBanners: allBanners.map(b => ({ 
        id: b._id, 
        title: b.title, 
        position: b.position, 
        status: b.status, 
        storeId: b.storeId 
      })),
      storeBanners: storeBanners.map(b => ({ 
        id: b._id, 
        title: b.title, 
        position: b.position, 
        status: b.status 
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Banner test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test banner without shouldDisplay filter
app.get('/api/test-banners-raw', async (req, res) => {
  try {
    const Banner = require('./models/Banner');
    const Store = require('./models/Store');
    
    const { store, position = 'hero' } = req.query;
    
    if (!store) {
      return res.status(400).json({ message: 'Store parameter is required' });
    }
    
    const storeDoc = await Store.findOne({
      $or: [
        { name: store },
        { slug: store }
      ],
      status: 'active'
    });
    
    if (!storeDoc) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    const banners = await Banner.find({
      storeId: storeDoc._id,
      position,
      status: 'active'
    }).sort({ priority: -1, createdAt: -1 });
    
    res.status(200).json({
      status: 'OK',
      message: 'Raw banner test completed',
      store: { id: storeDoc._id, name: storeDoc.name, slug: storeDoc.slug },
      position,
      banners: banners.map(b => ({
        id: b._id,
        title: b.title,
        position: b.position,
        status: b.status,
        placement: b.placement,
        display: b.display,
        targeting: b.targeting
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Raw banner test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test image access route
app.get('/api/test-image', (req, res) => {
  const testImagePath = path.join(__dirname, 'uploads', 'images', 'ewa-fashion-688913a4ba9eae7bd515a164', '1754234527627_23x4c16qnsr.jpg');
  if (fs.existsSync(testImagePath)) {
    res.json({
      status: 'OK',
      message: 'Test image exists',
      path: testImagePath,
      accessible: true
    });
  } else {
    res.json({
      status: 'ERROR',
      message: 'Test image not found',
      path: testImagePath,
      accessible: false
    });
  }
});

// Test CORS headers route
app.get('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({
    status: 'OK',
    message: 'CORS headers are working',
    timestamp: new Date().toISOString()
  });
});

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to EWA Fashion API',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });
});

// Add a simple API test route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'EWA Fashion API is working',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/auth', customerAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongoURI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${config.mongoURI.split('/').pop().split('?')[0]}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('🔧 Please check your MongoDB connection string in .env file');
    console.error('📝 Make sure your MongoDB credentials are correct');
    console.error('📝 Example .env file:');
    console.error('   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ewa-fashion');
    
    // In production, don't exit the process, just log the error
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ Running in production mode - continuing without database connection');
    } else {
      process.exit(1);
    }
  });

// Export for Vercel
module.exports = app;

// Start server if not in production or if running locally
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}