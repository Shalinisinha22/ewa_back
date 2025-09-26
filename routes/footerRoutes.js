const express = require('express');
const router = express.Router();
const {
  getFooterSettings,
  getPublicFooterSettings,
  updateFooterSettings,
  resetFooterSettings
} = require('../controllers/footerController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Public route (no authentication required)
router.get('/public', getPublicFooterSettings);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('settings'));

// Footer settings routes
router.route('/')
  .get(getFooterSettings)
  .put(updateFooterSettings);

router.post('/reset', resetFooterSettings);

module.exports = router;






