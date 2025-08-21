const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getCouponStats,
  getCouponUsage
} = require('../controllers/couponController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('coupons'));

// Coupon routes
router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.get('/stats', getCouponStats);
router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);

router.route('/:id')
  .get(getCouponById)
  .put(updateCoupon)
  .delete(deleteCoupon);

router.get('/:id/usage', getCouponUsage);

module.exports = router;