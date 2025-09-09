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
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173', // Vite dev server
  'https://ewa-luxe.vercel.app',
  'https://ewaluxe-admin.vercel.app',
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

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EWA Fashion API',
    status: 'active',
    documentation: '/api/docs',
    version: '1.0.0'
  });
});

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
    vercel: process.env.VERCEL,
    mongoUri: config.mongoURI ? 'Configured' : 'Not configured'
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

// Add a simple test route that doesn't require database
app.get('/api/test-deployment', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Deployment test successful',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    nodeVersion: process.version
  });
});

// API routes with logging middleware
const routeLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
};

app.use(routeLogger);

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/store-analytics', require('./routes/storeAnalyticsRoutes'));
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

// Error handling for routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
if (config.mongoURI) {
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
} else {
  console.warn('⚠️ MONGO_URI not found - database connection skipped');
  console.warn('📝 Please set MONGO_URI environment variable in Vercel');
}

// Export for Vercel
module.exports = app;

// Start server only in development environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`API Health Check: http://localhost:${PORT}/api`);
  });
}