const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ewa-fashion')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function checkCategories() {
  try {
    console.log('Checking existing categories...\n');
    
    // Get all categories
    const categories = await Category.find({}).select('name slug status productCount');
    
    if (categories.length === 0) {
      console.log('No categories found in the database.');
      console.log('You need to create categories first before bulk uploading products.');
      console.log('\nSuggested categories for your CSV:');
      console.log('- Men');
      console.log('- Women');
      console.log('- Accessories');
      console.log('- Home & Kitchen');
      console.log('- Electronics');
      console.log('- Fitness');
      console.log('- Kids');
    } else {
      console.log('Existing categories:');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name} (${cat.slug}) - Status: ${cat.status} - Products: ${cat.productCount}`);
      });
      
      console.log('\nFor your CSV template, use these exact category names:');
      categories.forEach(cat => {
        console.log(`- ${cat.name}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking categories:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCategories();


