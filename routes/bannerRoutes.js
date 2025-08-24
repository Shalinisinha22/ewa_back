const express = require('express');
const router = express.Router();
const {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getBannersByPosition,
  getPublicBannersByPosition,
  recordBannerImpression,
  recordBannerClick,
  recordPublicBannerImpression,
  recordPublicBannerClick,
  getBannerAnalytics
} = require('../controllers/bannerController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');

// Public routes (no authentication required)
router.get('/public/position/:position', identifyStore, getPublicBannersByPosition);
router.post('/public/:id/impression', identifyStore, recordPublicBannerImpression);
router.post('/public/:id/click', identifyStore, recordPublicBannerClick);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('banners'));

// Banner routes
router.route('/')
  .get(getBanners)
  .post(createBanner);

router.get('/position/:position', getBannersByPosition);
router.get('/analytics', getBannerAnalytics);

router.route('/:id')
  .get(getBannerById)
  .put(updateBanner)
  .delete(deleteBanner);

router.post('/:id/impression', recordBannerImpression);
router.post('/:id/click', recordBannerClick);

module.exports = router;