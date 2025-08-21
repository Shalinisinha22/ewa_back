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

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      config.frontendUrl
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Store-ID']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    timestamp: new Date().toISOString()
  });
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

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Customer auth routes with specific CORS handling
app.use('/api/customer/auth', (req, res, next) => {
  // Set CORS headers for customer auth routes
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Store-ID, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, customerAuthRoutes);

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
    process.exit(1);
  });

app.listen(config.port, () => {
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${config.port}`);
});

module.exports = app;