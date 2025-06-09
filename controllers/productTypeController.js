const asyncHandler = require('express-async-handler');
const ProductType = require('../models/ProductType');

// @desc    Create a product type
// @route   POST /api/producttypes
// @access  Private/Admin
const createProductType = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const value = name.toLowerCase();

  const productType = await ProductType.create({
    name,
    value,
  });

  if (productType) {
    res.status(201).json(productType);
  } else {
    res.status(400);
    throw new Error('Invalid product type data');
  }
});

// @desc    Get all product types
// @route   GET /api/producttypes
// @access  Public
const getProductTypes = asyncHandler(async (req, res) => {
  const productTypes = await ProductType.find({});
  res.json(productTypes);
});

// @desc    Update product type
// @route   PUT /api/producttypes/:id
// @access  Private/Admin
const updateProductType = asyncHandler(async (req, res) => {
  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    productType.name = req.body.name || productType.name;
    productType.value = req.body.name.toLowerCase() || productType.value;
    productType.status = req.body.status === undefined ? productType.status : req.body.status;

    const updatedProductType = await productType.save();
    res.json(updatedProductType);
  } else {
    res.status(404);
    throw new Error('Product type not found');
  }
});

// @desc    Delete product type
// @route   DELETE /api/producttypes/:id
// @access  Private/Admin
const deleteProductType = asyncHandler(async (req, res) => {
  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    await productType.deleteOne();
    res.json({ message: 'Product type removed' });
  } else {
    res.status(404);
    throw new Error('Product type not found');
  }
});

module.exports = {
  createProductType,
  getProductTypes,
  updateProductType,
  deleteProductType,
};