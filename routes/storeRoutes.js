const express = require('express');
const router = express.Router();
const {
  getPublicStoreByIdentifier,
  getDefaultStore
} = require('../controllers/storeController');

// Public routes (no authentication required)
// IMPORTANT: Put specific routes before parameterized routes
router.get('/public/default', getDefaultStore);
router.get('/public/:identifier', getPublicStoreByIdentifier);

module.exports = router; 