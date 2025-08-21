const express = require('express');
const router = express.Router();
const {
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getPageBySlug,
  getPublishedPages,
  duplicatePage,
  getPageStats
} = require('../controllers/pageController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('pages'));

// Page routes
router.route('/')
  .get(getPages)
  .post(createPage);

router.get('/published', getPublishedPages);
router.get('/stats', getPageStats);
router.get('/slug/:slug', getPageBySlug);

router.route('/:id')
  .get(getPageById)
  .put(updatePage)
  .delete(deletePage);

router.post('/:id/duplicate', duplicatePage);

module.exports = router;