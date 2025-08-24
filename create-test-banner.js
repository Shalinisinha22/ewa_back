const mongoose = require('mongoose');
const Banner = require('./models/Banner');
const Store = require('./models/Store');
const config = require('./config/config');

async function createTestBanner() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find the store
    const store = await Store.findOne({ slug: 'ewa-luxe' });
    if (!store) {
      console.log('❌ Store not found');
      return;
    }
    console.log('✅ Found store:', store.name);

    // Check if banner already exists
    const existingBanner = await Banner.findOne({
      storeId: store._id,
      position: 'hero'
    });

    if (existingBanner) {
      console.log('✅ Banner already exists:', existingBanner.title);
      console.log('Banner details:', {
        id: existingBanner._id,
        title: existingBanner.title,
        position: existingBanner.position,
        status: existingBanner.status,
        placement: existingBanner.placement
      });
      return;
    }

    // Create test banner
    const testBanner = new Banner({
      storeId: store._id,
      title: 'Summer Sale 2025',
      subtitle: 'UP TO 20% DISCOUNT ON',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat explicabo architecto odit autem esse consequatur quaerat natus optio ullam, rem, laudantium distinctio nostrum, necessitatibus quo debitis aut tempore ex amet ea adipisci!',
      image: 'https://res.cloudinary.com/dd4fdmtmj/image/upload/v1755972062/ewa-fashion/banners/summer-sale-2025.jpg',
      position: 'hero',
      placement: {
        page: 'home'
      },
      status: 'active',
      priority: 0,
      analytics: {
        impressions: 0,
        clicks: 0,
        conversions: 0
      }
    });

    await testBanner.save();
    console.log('✅ Test banner created successfully:', testBanner.title);
    console.log('Banner ID:', testBanner._id);

  } catch (error) {
    console.error('❌ Error creating test banner:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestBanner();
