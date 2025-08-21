# Setup Guide - Fix MongoDB Connection

## 🔧 Current Issue
Your server is failing to connect to MongoDB due to authentication issues.

## 📝 Solution Steps

### 1. Create Environment File
Create a `.env` file in the `project/backend/` directory:

```bash
# Create .env file
touch .env
```

### 2. Add MongoDB Configuration
Add this to your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration (REPLACE WITH YOUR ACTUAL CREDENTIALS)
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.svd4zft.mongodb.net/ewa-fashion?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Get Your MongoDB Credentials

#### Option A: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in to your account
3. Select your cluster
4. Click "Connect"
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `your_username` and `your_password` with your actual credentials

#### Option B: Local MongoDB
If you want to use local MongoDB:
```env
MONGO_URI=mongodb://localhost:27017/ewa-fashion
```

### 4. Test Connection
Restart your server:
```bash
npm run dev
```

## ✅ Expected Output
```
⚠️  MONGO_URI not found in environment variables
📝 Please create a .env file with your MongoDB connection string
📝 Example: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ewa-fashion
🚀 Server running in development mode on port 5000
✅ Connected to MongoDB
📊 Database: ewa-fashion
```

## 🔒 Security Notes
- Never commit your `.env` file to version control
- Use strong passwords for MongoDB
- Change JWT_SECRET in production
- Add `.env` to your `.gitignore` file

## 🆘 Still Having Issues?
1. Check your MongoDB credentials
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Verify your cluster is running
4. Check network connectivity

## 📞 Need Help?
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- MongoDB Connection String Format: https://docs.mongodb.com/manual/reference/connection-string/ 