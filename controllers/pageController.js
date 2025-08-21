const Page = require('../models/Page');

// @desc    Get all pages
// @route   GET /api/pages
// @access  Private
const getPages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Type filter
    if (req.query.type) {
      query.type = req.query.type;
    }

    const pages = await Page.find(query)
      .populate('author', 'name')
      .populate('lastModifiedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Page.countDocuments(query);

    res.json({
      pages,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get page by ID
// @route   GET /api/pages/:id
// @access  Private
const getPageById = async (req, res) => {
  try {
    const page = await Page.findOne({
      _id: req.params.id,
      storeId: req.storeId
    })
      .populate('author', 'name')
      .populate('lastModifiedBy', 'name')
      .populate('navigation.parentPage', 'title slug');

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create page
// @route   POST /api/pages
// @access  Private
const createPage = async (req, res) => {
  try {
    const pageData = {
      ...req.body,
      storeId: req.storeId,
      author: req.admin._id
    };

    // Check if slug already exists
    if (pageData.slug) {
      const existingPage = await Page.findOne({
        slug: pageData.slug,
        storeId: req.storeId
      });

      if (existingPage) {
        return res.status(400).json({ message: 'Page with this slug already exists' });
      }
    }

    const page = await Page.create(pageData);
    
    // Populate before sending response
    await page.populate('author', 'name');

    res.status(201).json(page);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update page
// @route   PUT /api/pages/:id
// @access  Private
const updatePage = async (req, res) => {
  try {
    const page = await Page.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Check slug uniqueness if slug is being updated
    if (req.body.slug && req.body.slug !== page.slug) {
      const existingPage = await Page.findOne({
        slug: req.body.slug,
        storeId: req.storeId,
        _id: { $ne: req.params.id }
      });

      if (existingPage) {
        return res.status(400).json({ message: 'Page with this slug already exists' });
      }
    }

    // Validate parent page
    if (req.body.navigation && req.body.navigation.parentPage) {
      if (req.body.navigation.parentPage === req.params.id) {
        return res.status(400).json({ message: 'Page cannot be its own parent' });
      }

      const parentPage = await Page.findOne({
        _id: req.body.navigation.parentPage,
        storeId: req.storeId
      });

      if (!parentPage) {
        return res.status(400).json({ message: 'Parent page not found' });
      }
    }

    // Update last modified by
    req.body.lastModifiedBy = req.admin._id;

    Object.assign(page, req.body);
    const updatedPage = await page.save();
    
    // Populate before sending response
    await updatedPage.populate('author', 'name');
    await updatedPage.populate('lastModifiedBy', 'name');

    res.json(updatedPage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete page
// @route   DELETE /api/pages/:id
// @access  Private
const deletePage = async (req, res) => {
  try {
    const page = await Page.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Check if page has children
    const childrenCount = await Page.countDocuments({
      'navigation.parentPage': req.params.id,
      storeId: req.storeId
    });

    if (childrenCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete page with ${childrenCount} child pages. Please delete child pages first.` 
      });
    }

    await Page.findByIdAndDelete(req.params.id);
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get page by slug
// @route   GET /api/pages/slug/:slug
// @access  Private
const getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({
      slug: req.params.slug,
      storeId: req.storeId,
      status: 'published'
    })
      .populate('author', 'name');

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Increment views
    await page.incrementViews();

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get published pages
// @route   GET /api/pages/published
// @access  Private
const getPublishedPages = async (req, res) => {
  try {
    const pages = await Page.find({
      storeId: req.storeId,
      status: 'published',
      'navigation.showInMenu': true
    })
      .sort({ 'navigation.menuOrder': 1, title: 1 })
      .select('title slug navigation');

    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Duplicate page
// @route   POST /api/pages/:id/duplicate
// @access  Private
const duplicatePage = async (req, res) => {
  try {
    const originalPage = await Page.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!originalPage) {
      return res.status(404).json({ message: 'Page not found' });
    }

    // Create duplicate
    const duplicateData = originalPage.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.slug = `${duplicateData.slug}-copy`;
    duplicateData.status = 'draft';
    duplicateData.author = req.admin._id;
    duplicateData.publishedAt = null;
    duplicateData.views = 0;

    // Ensure unique slug
    let counter = 1;
    let uniqueSlug = duplicateData.slug;
    while (await Page.findOne({ slug: uniqueSlug, storeId: req.storeId })) {
      uniqueSlug = `${duplicateData.slug}-${counter}`;
      counter++;
    }
    duplicateData.slug = uniqueSlug;

    const duplicatedPage = await Page.create(duplicateData);
    
    // Populate before sending response
    await duplicatedPage.populate('author', 'name');

    res.status(201).json(duplicatedPage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get page statistics
// @route   GET /api/pages/stats
// @access  Private
const getPageStats = async (req, res) => {
  try {
    const stats = await Page.aggregate([
      { $match: { storeId: req.storeId } },
      {
        $group: {
          _id: null,
          totalPages: { $sum: 1 },
          publishedPages: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftPages: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          privatePages: {
            $sum: { $cond: [{ $eq: ['$status', 'private'] }, 1, 0] }
          },
          totalViews: { $sum: '$views' },
          averageViews: { $avg: '$views' }
        }
      }
    ]);

    // Get most viewed pages
    const topPages = await Page.find({
      storeId: req.storeId,
      views: { $gt: 0 }
    })
      .sort({ views: -1 })
      .limit(10)
      .select('title slug views status');

    res.json({
      overview: stats[0] || {
        totalPages: 0,
        publishedPages: 0,
        draftPages: 0,
        privatePages: 0,
        totalViews: 0,
        averageViews: 0
      },
      topPages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  getPageBySlug,
  getPublishedPages,
  duplicatePage,
  getPageStats
};