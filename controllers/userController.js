const Customer = require('../models/Customer');

// @desc    Get all users/customers
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';

    let query = { storeId: req.storeId };

    if (keyword) {
      query.$or = [
        { firstName: { $regex: keyword, $options: 'i' } },
        { lastName: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }

    const count = await Customer.countDocuments(query);
    const users = await Customer.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (pageNumber - 1));

    res.json({
      users,
      page: pageNumber,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await Customer.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  deleteUser
};