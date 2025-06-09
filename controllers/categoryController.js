const asyncHandler = require('express-async-handler');
const Category = require('../models/categoryModel.js');

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const productType = req.query.productType || null;
  
  const query = {};
  
  if (productType) {
    query.productType = productType;
  }
  
  const categories = await Category.find(query);
  res.json(categories);
});

// @desc    Fetch single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    res.json(category);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    await Category.deleteOne({ _id: category._id });
    res.json({ message: 'Category removed' });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, image, parent, productType } = req.body;

  const categoryExists = await Category.findOne({ slug });

  if (categoryExists) {
    res.status(400);
    throw new Error('Category with this slug already exists');
  }

  const category = new Category({
    name,
    slug,
    description,
    image: image || '/uploads/sample-category.jpg',
    parent: parent || null,
    productType
  });

  const createdCategory = await category.save();
  res.status(201).json(createdCategory);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, image, parent, productType } = req.body;

  const category = await Category.findById(req.params.id);

  if (category) {
    // Check if the new slug already exists and is not this category
    if (slug && slug !== category.slug) {
      const slugExists = await Category.findOne({ slug });
      if (slugExists) {
        res.status(400);
        throw new Error('Category with this slug already exists');
      }
    }

    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description = description || category.description;
    category.image = image || category.image;
    category.parent = parent !== undefined ? parent : category.parent;
    category.productType = productType || category.productType;

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

module.exports = {
  getCategories,
  getCategoryById,
  deleteCategory,
  createCategory,
  updateCategory
};