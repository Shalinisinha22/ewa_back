const mongoose = require('mongoose');
const Store = require('./models/Store');
const Category = require('./models/Category');
const Product = require('./models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    testStoreSystem();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

async function testStoreSystem() {
  try {
    console.log('\n🔍 Testing Store System...\n');

    // 1. Check existing stores
    const stores = await Store.find({ status: 'active' });
    console.log(`📊 Found ${stores.length} active stores:`);
    stores.forEach(store => {
      console.log(`   - ${store.name} (slug: ${store.slug}, ID: ${store._id})`);
    });

    if (stores.length === 0) {
      console.log('\n⚠️  No stores found. Creating a test store...');
      
      // Create a test store
      const testStore = await Store.create({
        name: 'Test Fashion Store',
        slug: 'test-store',
        description: 'A test store for development',
        status: 'active',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          language: 'en'
        }
      });
      
      console.log(`✅ Created test store: ${testStore.name} (${testStore.slug})`);
      
      // Create test categories for this store
      const womenCategory = await Category.create({
        name: 'Women',
        slug: 'women',
        description: 'Women\'s fashion collection',
        storeId: testStore._id,
        status: 'active',
        sortOrder: 1
      });
      
      const menCategory = await Category.create({
        name: 'Men',
        slug: 'men',
        description: 'Men\'s fashion collection',
        storeId: testStore._id,
        status: 'active',
        sortOrder: 2
      });
      
      console.log(`✅ Created categories: ${womenCategory.name}, ${menCategory.name}`);
      
      // Create test products
      const product1 = await Product.create({
        name: 'Women\'s Dress',
        description: 'Beautiful women\'s dress',
        price: 999,
        category: womenCategory._id,
        storeId: testStore._id,
        status: 'active',
        stock: { quantity: 10 }
      });
      
      const product2 = await Product.create({
        name: 'Men\'s Shirt',
        description: 'Stylish men\'s shirt',
        price: 799,
        category: menCategory._id,
        storeId: testStore._id,
        status: 'active',
        stock: { quantity: 15 }
      });
      
      console.log(`✅ Created products: ${product1.name}, ${product2.name}`);
    }

    // 2. Test store-specific queries
    const firstStore = stores[0] || await Store.findOne({ status: 'active' });
    if (firstStore) {
      console.log(`\n🔍 Testing queries for store: ${firstStore.name}`);
      
      const storeCategories = await Category.find({ 
        storeId: firstStore._id, 
        status: 'active' 
      });
      console.log(`   📂 Categories: ${storeCategories.length}`);
      
      const storeProducts = await Product.find({ 
        storeId: firstStore._id, 
        status: 'active' 
      });
      console.log(`   🛍️  Products: ${storeProducts.length}`);
    }

    console.log('\n✅ Store system test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
} 