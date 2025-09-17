const express = require('express');
const router = express.Router();
const {
  getPromoBanners,
  getPromoBannerById,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  getAdminPromoBanners
} = require('../controllers/promoBannerController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');
const { identifyStore } = require('../middleware/storeIdentification');
const PromoBanner = require('../models/PromoBanner');

// Public routes (no authentication required)
router.get('/public', identifyStore, getPromoBanners);

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('banners'));

// Admin routes
router.get('/admin/all', getAdminPromoBanners);
router.route('/')
  .get(getAdminPromoBanners)
  .post(createPromoBanner);

router.route('/:id')
  .get(getPromoBannerById)
  .put(updatePromoBanner)
  .delete(deletePromoBanner);

// Toggle status route
router.put('/:id/toggle', async (req, res) => {
  try {
    const promoBanner = await PromoBanner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!promoBanner) {
      return res.status(404).json({ message: 'Promo banner not found' });
    }

    promoBanner.isActive = !promoBanner.isActive;
    await promoBanner.save();

    res.json(promoBanner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
