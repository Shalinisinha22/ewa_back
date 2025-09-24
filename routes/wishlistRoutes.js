const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const { protectCustomer } = require('../middleware/customerAuth');
const { identifyStore } = require('../middleware/storeIdentification');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', identifyStore, protectCustomer, async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ 
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId 
    })
    .populate({
      path: 'product',
      select: 'name slug price discountPrice oldPrice images category stock status',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    })
    .sort({ addedAt: -1 });

    res.json({
      success: true,
      data: wishlist,
      count: wishlist.length
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching wishlist'
    });
  }
});

// @route   POST /api/wishlist
// @desc    Add product to wishlist
// @access  Private
router.post('/', identifyStore, protectCustomer, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product already exists in wishlist
    const existingWishlistItem = await Wishlist.findOne({
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId,
      productId: productId
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists in wishlist'
      });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId,
      productId: productId
    });

    await wishlistItem.save();

    // Populate the product details
    await wishlistItem.populate({
      path: 'product',
      select: 'name slug price discountPrice oldPrice images category stock status',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product added to wishlist successfully',
      data: wishlistItem
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists in wishlist'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while adding to wishlist'
    });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/:productId', identifyStore, protectCustomer, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOneAndDelete({
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId,
      productId: productId
    });

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    res.json({
      success: true,
      message: 'Product removed from wishlist successfully'
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing from wishlist'
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear entire wishlist
// @access  Private
router.delete('/', identifyStore, protectCustomer, async (req, res) => {
  try {
    await Wishlist.deleteMany({
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId
    });

    res.json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing wishlist'
    });
  }
});

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', identifyStore, protectCustomer, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      customerId: req.customer._id,
      storeId: req.store?._id || req.storeId,
      productId: productId
    });

    res.json({
      success: true,
      isInWishlist: !!wishlistItem
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking wishlist'
    });
  }
});

module.exports = router;
