const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testStoreAPI() {
  try {
    console.log('🧪 Testing Store API Endpoints...\n');

    // Test 1: Get store by name
    console.log('1. Testing store by name: "Ewa Luxe"');
    try {
      const response1 = await axios.get(`${BASE_URL}/stores/public/Ewa Luxe`);
      console.log('✅ Success:', response1.data.store.name);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 2: Get store by slug
    console.log('\n2. Testing store by slug: "ewa-luxe"');
    try {
      const response2 = await axios.get(`${BASE_URL}/stores/public/ewa-luxe`);
      console.log('✅ Success:', response2.data.store.name);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 3: Get default store
    console.log('\n3. Testing default store');
    try {
      const response3 = await axios.get(`${BASE_URL}/stores/public/default`);
      console.log('✅ Success:', response3.data.store.name);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 4: Get categories with store parameter
    console.log('\n4. Testing categories with store parameter');
    try {
      const response4 = await axios.get(`${BASE_URL}/categories/public?store=Ewa Luxe`);
      console.log('✅ Success:', response4.data.categories?.length || 0, 'categories found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    // Test 5: Get products with store parameter
    console.log('\n5. Testing products with store parameter');
    try {
      const response5 = await axios.get(`${BASE_URL}/products/public?store=Ewa Luxe`);
      console.log('✅ Success:', response5.data.products?.length || 0, 'products found');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Store API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStoreAPI(); 