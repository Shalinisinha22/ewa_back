require('dotenv').config();

const config = {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Add other configuration variables as needed
};

// Validate MongoDB URI
if (!process.env.MONGO_URI) {
    console.warn('⚠️  MONGO_URI not found in environment variables');
    console.warn('📝 Please create a .env file with your MongoDB connection string');
    console.warn('📝 Example: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ewa-fashion');
}

module.exports = config;
