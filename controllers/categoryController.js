const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories (Public)
// @route   GET /api/categories/public
// @access  Public
const getPublicCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = { 
      status: 'active',
      storeId: req.storeId 
    };

    // Search functionality
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Parent filter
    if (req.query.parent) {
      query.parent = req.query.parent;
    } else if (req.query.topLevel === 'true') {
      query.parent = null;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Parent filter
    if (req.query.parent) {
      query.parent = req.query.parent;
    } else if (req.query.topLevel === 'true') {
      query.parent = null;
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments(query);

    res.json({
      categories,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      storeId: req.storeId
    }).populate('parent', 'name slug');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      storeId: req.storeId
    };

    // Validate parent category if provided
    if (categoryData.parent) {
      const parentCategory = await Category.findOne({
        _id: categoryData.parent,
        storeId: req.storeId
      });
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const category = await Category.create(categoryData);
    
    // Populate parent before sending response
    await category.populate('parent', 'name slug');

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Validate parent category if being updated
    if (req.body.parent) {
      // Prevent setting self as parent
      if (req.body.parent === req.params.id) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }

      const parentCategory = await Category.findOne({
        _id: req.body.parent,
        storeId: req.storeId
      });
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }

      // Prevent circular references
      const descendants = await category.getDescendants();
      const descendantIds = descendants.map(d => d._id.toString());
      if (descendantIds.includes(req.body.parent)) {
        return res.status(400).json({ message: 'Cannot set descendant as parent' });
      }
    }

    Object.assign(category, req.body);
    const updatedCategory = await category.save();
    
    // Populate parent before sending response
    await updatedCategory.populate('parent', 'name slug');

    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: req.params.id,
      storeId: req.storeId
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${productCount} products. Please move or delete products first.` 
      });
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({
      parent: req.params.id,
      storeId: req.storeId
    });

    if (childrenCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${childrenCount} subcategories. Please delete subcategories first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Private
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find({
      storeId: req.storeId,
      status: 'active'
    }).sort({ level: 1, sortOrder: 1, name: 1 });

    // Build tree structure
    const categoryMap = {};
    const tree = [];

    // First pass: create map
    categories.forEach(category => {
      categoryMap[category._id] = {
        ...category.toObject(),
        children: []
      };
    });

    // Second pass: build tree
    categories.forEach(category => {
      if (category.parent) {
        const parent = categoryMap[category.parent];
        if (parent) {
          parent.children.push(categoryMap[category._id]);
        }
      } else {
        tree.push(categoryMap[category._id]);
      }
    });

    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category products
// @route   GET /api/categories/:id/products
// @access  Private
const getCategoryProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const category = await Category.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get products from this category and all subcategories
    const descendants = await category.getDescendants();
    const categoryIds = [category._id, ...descendants.map(d => d._id)];

    const products = await Product.find({
      storeId: req.storeId,
      category: { $in: categoryIds },
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      storeId: req.storeId,
      category: { $in: categoryIds },
      status: 'active'
    });

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private
const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, sortOrder }

    const bulkOps = categories.map(cat => ({
      updateOne: {
        filter: { _id: cat.id, storeId: req.storeId },
        update: { sortOrder: cat.sortOrder }
      }
    }));

    await Category.bulkWrite(bulkOps);

    res.json({ message: 'Categories reordered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPublicCategories,
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getCategoryProducts,
  reorderCategories
};