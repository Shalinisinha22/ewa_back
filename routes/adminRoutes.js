const express = require('express');
const router = express.Router();
const {
  createSuperAdmin,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/adminController');
const { protect, storeAccess, authorize } = require('../middleware/auth');

// Public routes
router.post('/login', loginAdmin);
router.post('/super-admin', createSuperAdmin); // Initial super admin creation

// Protected routes
router.use(protect);
router.use(storeAccess);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changePassword);

// Admin management routes
router.route('/')
  .get(authorize('super_admin'), getAdmins) // Only super admin can view all admins
  .post(authorize('super_admin'), createAdmin); // Only super admin can create admins

router.route('/:id')
  .get(authorize('super_admin'), getAdminById) // Only super admin can view admin details
  .put(authorize('super_admin'), updateAdmin) // Only super admin can update admins
  .delete(authorize('super_admin'), deleteAdmin); // Only super admin can delete admins

module.exports = router;