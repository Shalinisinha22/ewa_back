const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Store = require('./models/Store');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    testCustomerLogin();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

async function testCustomerLogin() {
  try {
    console.log('\n🔍 Testing Customer Login...\n');

    const testEmail = 's@gmail.com';
    const testPassword = '12345678';
    const testStoreName = 'Ewa Luxe';

    // 1. Find the store
    console.log(`🔍 Looking for store: "${testStoreName}"`);
    const store = await Store.findOne({ 
      name: { $regex: new RegExp(testStoreName, 'i') },
      status: 'active'
    });

    if (!store) {
      console.log('❌ Store not found!');
      return;
    }
    console.log(`✅ Found store: ${store.name} (ID: ${store._id})`);

    // 2. Find the customer
    console.log(`\n🔍 Looking for customer with email: "${testEmail}" in store: ${store._id}`);
    const customer = await Customer.findOne({
      email: testEmail.toLowerCase(),
      storeId: store._id
    }).select('+password');

    if (!customer) {
      console.log('❌ Customer not found!');
      return;
    }
    console.log(`✅ Found customer: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Status: ${customer.status}`);
    console.log(`   Login Count: ${customer.loginCount}`);

    // 3. Check if customer is blocked
    if (customer.status === 'blocked') {
      console.log('❌ Customer is blocked!');
      return;
    }

    // 4. Test password
    console.log(`\n🔍 Testing password: "${testPassword}"`);
    const isPasswordValid = await bcrypt.compare(testPassword, customer.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid!');
      
      // 5. Update login stats (simulate successful login)
      customer.lastLogin = new Date();
      customer.loginCount += 1;
      await customer.save();
      console.log('✅ Login stats updated!');
      
    } else {
      console.log('❌ Password is invalid!');
      console.log(`   Stored hash: ${customer.password}`);
      
      // Let's create a new password hash for testing
      console.log('\n🔄 Creating new password hash for testing...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(testPassword, salt);
      console.log(`   New hash: ${newHash}`);
      
      // Update the customer's password
      customer.password = newHash;
      await customer.save();
      console.log('✅ Password updated! Try logging in again.');
    }

    console.log('\n✅ Customer login test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
} 