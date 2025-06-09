const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { connectDB } = require('./config/db.js');
const { errorHandler, notFound } = require('./middleware/errorMiddleware.js');

// Import routes
const productRoutes = require('./routes/productRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const categoryRoutes = require('./routes/categoryRoutes.js');
const uploadRoutes = require('./routes/uploadRoutes.js');
const productTypeRoutes = require('./routes/productTypeRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
}));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'E-commerce API is running!',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      users: '/api/users',
      orders: '/api/orders',
      categories: '/api/categories',
      productTypes: '/api/producttypes',
      upload: '/api/upload'
    }
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/producttypes', productTypeRoutes);

// Setup uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Modified server startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;