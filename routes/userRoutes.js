const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  deleteUser
} = require('../controllers/userController');
const { protect, storeAccess, checkPermission } = require('../middleware/auth');

// Protected routes
router.use(protect);
router.use(storeAccess);
router.use(checkPermission('customers'));

router.get('/', getUsers);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

module.exports = router;