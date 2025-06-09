const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel.js');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const productType = req.query.productType || null;
  const category = req.query.category || null;
  
  const query = {};
  
  if (productType) {
    query.productType = productType;
  }
  
  if (category) {
    query.category = category;
  }
  
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword, ...query });
  const products = await Product.find({ ...keyword, ...query })
    .populate('category', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name');

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const { 
    name, 
    price, 
    description, 
    images, 
    brand, 
    category,
    countInStock, 
    productType,
    attributes,
    discountPrice,
    featured
  } = req.body;

  // Convert image paths to full URLs
  const processedImages = images?.map(image => 
    image.startsWith('http') ? image : `/uploads/${image.split('/').pop()}`
  ) || ['/uploads/sample.jpg'];

  const product = new Product({
    name,
    price,
    user: req.user._id,
    images: processedImages,
    brand,
    category,
    countInStock,
    numReviews: 0,
    description,
    productType,
    attributes: attributes || {},
    discountPrice: discountPrice || 0,
    featured: featured || false
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    images,
    brand,
    category,
    countInStock,
    productType,
    attributes,
    discountPrice,
    featured
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    // Process images before updating
    const processedImages = images?.map(image => 
      image.startsWith('http') ? image : `/uploads/${image.split('/').pop()}`
    );

    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.images = processedImages || product.images;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;
    product.productType = productType || product.productType;
    product.attributes = attributes || product.attributes;
    product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
    product.featured = featured !== undefined ? featured : product.featured;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct
};