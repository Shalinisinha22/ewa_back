const Store = require('../models/Store');

// Store identification middleware for public routes
const identifyStore = async (req, res, next) => {
  try {
    console.log('🔍 Store Identification - Starting middleware');
    console.log('🔍 Store Identification - URL:', req.url);
    console.log('🔍 Store Identification - Query:', req.query);
    console.log('🔍 Store Identification - Headers host:', req.headers.host);
    
    let storeIdentifier = null;

    // Method 1: Check subdomain
    const host = req.headers.host;
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== '127') {
        storeIdentifier = subdomain;
        console.log('🔍 Store Identification - Found subdomain:', storeIdentifier);
      }
    }

    // Method 2: Check query parameters
    if (!storeIdentifier && req.query.store) {
      storeIdentifier = decodeURIComponent(req.query.store);
      console.log('🔍 Store Identification - Found store in query:', storeIdentifier);
    }
    
    // Method 2.5: Check storeId parameter (for logged-in users)
    if (!storeIdentifier && req.query.storeId) {
      // If storeId is provided, use it directly
      req.storeId = req.query.storeId;
      console.log('🔍 Store Identification - Using storeId from query:', req.storeId);
      return next();
    }

    // Method 3: Check path parameter (for future use)
    if (!storeIdentifier && req.params.storeSlug) {
      storeIdentifier = req.params.storeSlug;
      console.log('🔍 Store Identification - Found storeSlug:', storeIdentifier);
    }

    // Method 4: Default store (for development)
    if (!storeIdentifier) {
      console.log('🔍 Store Identification - No store found, looking for default');
      // For development, use a default store
      const defaultStore = await Store.findOne({ status: 'active' }).sort({ createdAt: 1 });
      if (defaultStore) {
        storeIdentifier = defaultStore.name; // Use store name instead of slug
        console.log('🔍 Store Identification - Found default store:', storeIdentifier);
      }
    }

    if (storeIdentifier) {
      console.log('🔍 Store Identification - Looking for store:', storeIdentifier);
      // Try to find store by name or slug (same approach as banner controller)
      const store = await Store.findOne({
        $or: [
          { name: storeIdentifier },
          { slug: storeIdentifier }
        ],
        status: 'active'
      });

      if (store) {
        req.storeId = store._id.toString();
        req.store = store;
        console.log('🔍 Store Identification - Store found:', store.name, 'ID:', req.storeId);
      } else {
        console.log('🔍 Store Identification - Store not found for:', storeIdentifier);
        return res.status(404).json({ 
          message: 'Store not found',
          error: 'The requested store does not exist or is not active'
        });
      }
    } else {
      console.log('🔍 Store Identification - No store identifier found');
      return res.status(400).json({ 
        message: 'Store not specified',
        error: 'Please specify a store using subdomain, query parameter, or path'
      });
    }

    console.log('🔍 Store Identification - Middleware completed, storeId:', req.storeId);
    next();
  } catch (error) {
    console.error('❌ Store identification error:', error);
    res.status(500).json({ 
      message: 'Error identifying store',
      error: error.message 
    });
  }
};

module.exports = { identifyStore }; 