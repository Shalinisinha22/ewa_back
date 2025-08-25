const Store = require('../models/Store');

// Store identification middleware for public routes
const identifyStore = async (req, res, next) => {
  try {
    console.log(`[Store Identification] Processing request for ${req.originalUrl}`);
    console.log(`[Store Identification] Headers:`, req.headers);
    console.log(`[Store Identification] Query:`, req.query);

    let storeIdentifier = null;

    // Method 1: Check subdomain
    const host = req.headers.host;
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== '127') {
        storeIdentifier = subdomain;
        console.log(`[Store Identification] Found store identifier from subdomain: ${storeIdentifier}`);
      }
    }

    // Method 2: Check query parameters
    if (!storeIdentifier && req.query.store) {
      storeIdentifier = decodeURIComponent(req.query.store);
      console.log(`[Store Identification] Found store identifier from query: ${storeIdentifier}`);
    }
    
    // Method 2.5: Check storeId parameter (for logged-in users)
    if (!storeIdentifier && req.query.storeId) {
      // If storeId is provided, use it directly
      req.storeId = req.query.storeId;
      return next();
    }

    // Method 3: Check path parameter (for future use)
    if (!storeIdentifier && req.params.storeSlug) {
      storeIdentifier = req.params.storeSlug;
    }

    // Method 4: Default store (for development)
    if (!storeIdentifier) {
      // For development, use a default store
      const defaultStore = await Store.findOne({ status: 'active' }).sort({ createdAt: 1 });
      if (defaultStore) {
        storeIdentifier = defaultStore.name; // Use store name instead of slug
        console.log(`[Store Identification] Using default store: ${storeIdentifier}`);
      }
    }

    if (storeIdentifier) {
      // Try to find store by name or slug (case-insensitive search)
      const store = await Store.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${storeIdentifier}$`, 'i') } },
          { slug: { $regex: new RegExp(`^${storeIdentifier}$`, 'i') } }
        ],
        status: 'active'
      });

      if (store) {
        req.storeId = store._id.toString();
        req.store = store;
        console.log(`[Store Identification] Store found: ${store.name} (ID: ${store._id})`);
      } else {
        console.log(`[Store Identification] Store not found for identifier: ${storeIdentifier}`);
        return res.status(404).json({ 
          message: 'Store not found',
          error: 'The requested store does not exist or is not active'
        });
      }
    } else {
      console.log(`[Store Identification] No store identifier found`);
      return res.status(400).json({ 
        message: 'Store not specified',
        error: 'Please specify a store using subdomain, query parameter, or path'
      });
    }

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