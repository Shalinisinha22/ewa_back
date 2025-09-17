const PromoBanner = require('../models/PromoBanner');

// @desc    Get all promo banners
// @route   GET /api/promo-banners/public
// @access  Public
const getPromoBanners = async (req, res) => {
  try {
    const { storeId, store } = req.query;

    if (!storeId && !store) {
      return res.status(400).json({ message: 'Store ID or store name is required' });
    }

    let query = { isActive: true };

    if (storeId) {
      query.storeId = storeId;
    } else if (store) {
      // Find store by name or slug
      const Store = require('../models/Store');
      const storeDoc = await Store.findOne({
        $or: [
          { name: store },
          { slug: store }
        ],
        status: 'active'
      });

      if (!storeDoc) {
        return res.status(404).json({ message: 'Store not found' });
      }

      query.storeId = storeDoc._id;
    }

    const promoBanners = await PromoBanner.find(query)
      .sort({ order: 1, createdAt: -1 });

    res.json({ banners: promoBanners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get promo banner by ID
// @route   GET /api/promo-banners/:id
// @access  Public
const getPromoBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    const promoBanner = await PromoBanner.findOne({
      _id: id,
      storeId,
      isActive: true
    });

    if (!promoBanner) {
      return res.status(404).json({ message: 'Promo banner not found' });
    }

    res.json(promoBanner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create promo banner
// @route   POST /api/promo-banners
// @access  Private
const createPromoBanner = async (req, res) => {
  try {
    const promoBannerData = {
      ...req.body,
      storeId: req.storeId
    };

    const promoBanner = await PromoBanner.create(promoBannerData);
    res.status(201).json(promoBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update promo banner
// @route   PUT /api/promo-banners/:id
// @access  Private
const updatePromoBanner = async (req, res) => {
  try {
    const promoBanner = await PromoBanner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!promoBanner) {
      return res.status(404).json({ message: 'Promo banner not found' });
    }

    Object.assign(promoBanner, req.body);
    const updatedPromoBanner = await promoBanner.save();

    res.json(updatedPromoBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete promo banner
// @route   DELETE /api/promo-banners/:id
// @access  Private
const deletePromoBanner = async (req, res) => {
  try {
    const promoBanner = await PromoBanner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!promoBanner) {
      return res.status(404).json({ message: 'Promo banner not found' });
    }

    await PromoBanner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Promo banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all promo banners (admin)
// @route   GET /api/promo-banners/admin
// @access  Private
const getAdminPromoBanners = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    // Status filter
    if (req.query.status !== undefined) {
      query.isActive = req.query.status === 'true';
    }

    const promoBanners = await PromoBanner.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PromoBanner.countDocuments(query);

    res.json({
      promoBanners,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPromoBanners,
  getPromoBannerById,
  createPromoBanner,
  updatePromoBanner,
  deletePromoBanner,
  getAdminPromoBanners
};
