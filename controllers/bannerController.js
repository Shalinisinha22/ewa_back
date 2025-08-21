const Banner = require('../models/Banner');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private
const getBanners = async (req, res) => {
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
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Position filter
    if (req.query.position) {
      query.position = req.query.position;
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Banner.countDocuments(query);

    res.json({
      banners,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get banner by ID
// @route   GET /api/banners/:id
// @access  Private
const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    })
      .populate('placement.categories', 'name')
      .populate('placement.products', 'name');

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create banner
// @route   POST /api/banners
// @access  Private
const createBanner = async (req, res) => {
  try {
    const bannerData = {
      ...req.body,
      storeId: req.storeId
    };

    const banner = await Banner.create(bannerData);
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private
const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    Object.assign(banner, req.body);
    const updatedBanner = await banner.save();

    res.json(updatedBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private
const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get banners by position
// @route   GET /api/banners/position/:position
// @access  Private
const getBannersByPosition = async (req, res) => {
  try {
    const { position } = req.params;
    const { page = 'home', device, userType, country } = req.query;

    let query = {
      storeId: req.storeId,
      position,
      status: 'active'
    };

    // Add placement filter
    if (page !== 'all') {
      query['placement.page'] = { $in: [page, 'all'] };
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 });

    // Filter banners based on display conditions
    const filteredBanners = banners.filter(banner => {
      return banner.shouldDisplay({
        device,
        userType,
        country
      });
    });

    res.json(filteredBanners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record banner impression
// @route   POST /api/banners/:id/impression
// @access  Private
const recordBannerImpression = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await banner.recordImpression();
    res.json({ message: 'Impression recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record banner click
// @route   POST /api/banners/:id/click
// @access  Private
const recordBannerClick = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await banner.recordClick();
    res.json({ message: 'Click recorded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get banner analytics
// @route   GET /api/banners/analytics
// @access  Private
const getBannerAnalytics = async (req, res) => {
  try {
    const analytics = await Banner.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: null,
          totalBanners: { $sum: 1 },
          activeBanners: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalImpressions: { $sum: '$analytics.impressions' },
          totalClicks: { $sum: '$analytics.clicks' },
          totalConversions: { $sum: '$analytics.conversions' }
        }
      }
    ]);

    // Get top performing banners
    const topBanners = await Banner.find({
      storeId: req.storeId,
      'analytics.impressions': { $gt: 0 }
    })
      .sort({ 'analytics.clicks': -1 })
      .limit(10)
      .select('title position analytics');

    // Calculate overall CTR
    const overview = analytics[0] || {
      totalBanners: 0,
      activeBanners: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    };

    overview.ctr = overview.totalImpressions > 0 
      ? ((overview.totalClicks / overview.totalImpressions) * 100).toFixed(2)
      : 0;

    overview.conversionRate = overview.totalClicks > 0
      ? ((overview.totalConversions / overview.totalClicks) * 100).toFixed(2)
      : 0;

    res.json({
      overview,
      topBanners
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  getBannersByPosition,
  recordBannerImpression,
  recordBannerClick,
  getBannerAnalytics
};