const express = require('express');
const router = express.Router();
const {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getBannersByPosition,
  recordBannerImpression,
  recordBannerClick,
  getBannerAnalytics
} = require('../controllers/bannerController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

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