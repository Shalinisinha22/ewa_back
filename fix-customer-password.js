const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    fixCustomerPassword();
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

async function fixCustomerPassword() {
  try {
    console.log('\n🔧 Fixing Customer Password...\n');

    const testEmail = 's@gmail.com';
    const testPassword = '12345678';

    // Find the customer
    console.log(`🔍 Looking for customer with email: "${testEmail}"`);
    const customer = await Customer.findOne({
      email: testEmail.toLowerCase()
    });

    if (!customer) {
      console.log('❌ Customer not found!');
      return;
    }
    console.log(`✅ Found customer: ${customer.firstName} ${customer.lastName}`);

    // Create a proper password hash
    console.log(`\n🔧 Creating proper password hash for: "${testPassword}"`);
    const salt = await bcrypt.genSalt(12);
    const properHash = await bcrypt.hash(testPassword, salt);
    console.log(`   New hash: ${properHash}`);

    // Update the password directly in the database to avoid double hashing
    console.log('\n💾 Updating password in database...');
    await Customer.updateOne(
      { _id: customer._id },
      { $set: { password: properHash } }
    );
    console.log('✅ Password updated successfully!');

    // Verify the password works
    console.log('\n🔍 Verifying password...');
    const updatedCustomer = await Customer.findById(customer._id).select('+password');
    const isPasswordValid = await bcrypt.compare(testPassword, updatedCustomer.password);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ Password verification failed!');
    }

    console.log('\n✅ Password fix completed!');
    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
} 