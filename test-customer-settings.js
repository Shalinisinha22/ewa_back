const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCustomerSettingsAPI() {
  try {
    console.log('🧪 Testing Customer Settings API Endpoints...\n');

    // Test 1: Get shipping settings with store name (before login)
    console.log('1. Testing shipping settings with store name (before login)');
    try {
      const response1 = await axios.get(`${BASE_URL}/customers/store/shipping?store=Ewa Luxe`);
      console.log('✅ Success:', response1.data.zones?.length || 0, 'shipping zones found');
      console.log('   Store ID:', response1.data.storeId);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Get payment settings with store name (before login)
    console.log('\n2. Testing payment settings with store name (before login)');
    try {
      const response2 = await axios.get(`${BASE_URL}/customers/store/payment?store=Ewa Luxe`);
      console.log('✅ Success:', response2.data.length || 0, 'payment gateways found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Get tax settings with store name (before login)
    console.log('\n3. Testing tax settings with store name (before login)');
    try {
      const response3 = await axios.get(`${BASE_URL}/customers/store/tax?store=Ewa Luxe`);
      console.log('✅ Success:', response3.data.length || 0, 'tax settings found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 4: Get shipping settings with store ID (after login)
    console.log('\n4. Testing shipping settings with store ID (after login)');
    try {
      const response4 = await axios.get(`${BASE_URL}/customers/store/shipping?storeId=688913a4ba9eae7bd515a164`);
      console.log('✅ Success:', response4.data.zones?.length || 0, 'shipping zones found');
      console.log('   Store ID:', response4.data.storeId);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 5: Get payment settings with store ID (after login)
    console.log('\n5. Testing payment settings with store ID (after login)');
    try {
      const response5 = await axios.get(`${BASE_URL}/customers/store/payment?storeId=688913a4ba9eae7bd515a164`);
      console.log('✅ Success:', response5.data.length || 0, 'payment gateways found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 6: Get tax settings with store ID (after login)
    console.log('\n6. Testing tax settings with store ID (after login)');
    try {
      const response6 = await axios.get(`${BASE_URL}/customers/store/tax?storeId=688913a4ba9eae7bd515a164`);
      console.log('✅ Success:', response6.data.length || 0, 'tax settings found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Customer Settings API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCustomerSettingsAPI();
