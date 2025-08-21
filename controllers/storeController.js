const Store = require('../models/Store');

// @desc    Get store by identifier (name or slug) (Public)
// @route   GET /api/stores/public/:identifier
// @access  Public
const getPublicStoreByIdentifier = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    
    // Try to find store by name first (case-insensitive)
    let store = await Store.findOne({
      name: { $regex: new RegExp(identifier, 'i') },
      status: 'active'
    });

    // If not found by name, try by slug
    if (!store) {
      store = await Store.findOne({
        slug: identifier,
        status: 'active'
      });
    }

    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found',
        error: 'The requested store does not exist or is not active'
      });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get default store (Public)
// @route   GET /api/stores/public/default
// @access  Public
const getDefaultStore = async (req, res) => {
  try {
    const store = await Store.findOne({ 
      status: 'active' 
    }).sort({ createdAt: 1 });

    if (!store) {
      return res.status(404).json({ 
        message: 'No stores available',
        error: 'No active stores found in the system'
      });
    }

    res.json({ store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicStoreByIdentifier,
  getDefaultStore
}; 