const Product = require('../models/Product');
const Category = require('../models/Category');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Helper function to update category product count
const updateCategoryProductCount = async (categoryId, storeId) => {
  if (!categoryId) return;
  
  try {
    const productCount = await Product.countDocuments({
      category: categoryId,
      storeId: storeId
    });
    
    await Category.findByIdAndUpdate(categoryId, {
      productCount: productCount
    });
  } catch (error) {
    console.error('Error updating category product count:', error);
  }
};

// Helper function to recalculate all category product counts
const recalculateAllCategoryProductCounts = async (storeId) => {
  try {
    const categories = await Category.find({ storeId });
    
    for (const category of categories) {
      const productCount = await Product.countDocuments({
        category: category._id,
        storeId: storeId
      });
      
      await Category.findByIdAndUpdate(category._id, {
        productCount: productCount
      });
    }
    
    console.log(`Recalculated product counts for ${categories.length} categories`);
  } catch (error) {
    console.error('Error recalculating category product counts:', error);
  }
};

// @desc    Get all products (Public)
// @route   GET /api/products/public
// @access  Public
const getPublicProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { 
      status: 'active',
      storeId: req.storeId 
    };

    // Search functionality
    if (req.query.keyword) {
      query.$text = { $search: req.query.keyword };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Featured filter
    if (req.query.featured) {
      query.featured = req.query.featured === 'true';
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Stock filter
    if (req.query.inStock) {
      query['stock.quantity'] = { $gt: 0 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

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

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId };

    // Search functionality
    if (req.query.keyword) {
      query.$text = { $search: req.query.keyword };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Featured filter
    if (req.query.featured) {
      query.featured = req.query.featured === 'true';
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Stock filter
    if (req.query.inStock) {
      query['stock.quantity'] = { $gt: 0 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

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

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      storeId: req.storeId
    };

    // Validate category exists
    if (productData.category) {
      const category = await Category.findOne({
        _id: productData.category,
        storeId: req.storeId
      });
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    const product = await Product.create(productData);
    
    // Populate category before sending response
    await product.populate('category', 'name slug');

    // Update category product count
    if (product.category) {
      await updateCategoryProductCount(product.category, req.storeId);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Store the old category ID before updating
    const oldCategoryId = product.category;

    // Validate category if being updated
    if (req.body.category) {
      const category = await Category.findOne({
        _id: req.body.category,
        storeId: req.storeId
      });
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    
    // Populate category before sending response
    await updatedProduct.populate('category', 'name slug');

    // Update category product counts
    if (oldCategoryId && oldCategoryId.toString() !== updatedProduct.category?.toString()) {
      // Product was moved to a different category
      await updateCategoryProductCount(oldCategoryId, req.storeId); // Update old category
      await updateCategoryProductCount(updatedProduct.category, req.storeId); // Update new category
    } else if (updatedProduct.category) {
      // Same category, just update the count
      await updateCategoryProductCount(updatedProduct.category, req.storeId);
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Store category ID before deleting
    const categoryId = product.category;

    await Product.findByIdAndDelete(req.params.id);
    
    // Update category product count
    if (categoryId) {
      await updateCategoryProductCount(categoryId, req.storeId);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Private
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.find({
      storeId: req.storeId,
      featured: true,
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products by category (Public)
// @route   GET /api/products/public/category/:categoryId
// @access  Public
const getPublicProductsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      storeId: req.storeId,
      category: req.params.categoryId,
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      storeId: req.storeId,
      category: req.params.categoryId,
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

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Private
const getProductsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      storeId: req.storeId,
      category: req.params.categoryId,
      status: 'active'
    })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      storeId: req.storeId,
      category: req.params.categoryId,
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

// @desc    Search products
// @route   GET /api/products/search
// @access  Private
const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, inStock } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = { storeId: req.storeId, status: 'active' };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

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

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private
const updateProductStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'set', 'add', 'subtract'

    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    switch (operation) {
      case 'set':
        product.stock.quantity = quantity;
        break;
      case 'add':
        product.stock.quantity += quantity;
        break;
      case 'subtract':
        product.stock.quantity = Math.max(0, product.stock.quantity - quantity);
        break;
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    // Update status based on stock
    if (product.stock.quantity <= 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock') {
      product.status = 'active';
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Bulk update products
// @route   PUT /api/products/bulk/update
// @access  Private
const bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;

    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        storeId: req.storeId
      },
      updates
    );

    res.json({
      message: `${result.modifiedCount} products updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ storeId: req.storeId });
    const activeProducts = await Product.countDocuments({ 
      storeId: req.storeId, 
      status: 'active' 
    });
    const draftProducts = await Product.countDocuments({ 
      storeId: req.storeId, 
      status: 'draft' 
    });
    const outOfStockProducts = await Product.countDocuments({
      storeId: req.storeId,
      'stock.quantity': { $lte: 0 }
    });

    res.json({
      totalProducts,
      activeProducts,
      draftProducts,
      outOfStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recalculate all category product counts
// @route   POST /api/products/recalculate-category-counts
// @access  Private
const recalculateCategoryProductCounts = async (req, res) => {
  try {
    await recalculateAllCategoryProductCounts(req.storeId);
    res.json({ message: 'Category product counts recalculated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk upload products from CSV
// @route   POST /api/products/bulk-upload
// @access  Private
const bulkUploadProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    let successCount = 0;

    // Parse CSV file
    const csvData = req.file.buffer.toString();
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const productData = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            productData[header] = values[index];
          }
        });

        // Validate required fields
        if (!productData.name || !productData.price || !productData.category || !productData.brand) {
          errors.push(`Row ${i + 1}: Missing required fields (name, price, category, brand)`);
          continue;
        }

        // Find category by name
        const category = await Category.findOne({
          name: { $regex: new RegExp(productData.category, 'i') },
          storeId: req.storeId
        });

        if (!category) {
          errors.push(`Row ${i + 1}: Category "${productData.category}" not found`);
          continue;
        }

        // Create product
        const product = await Product.create({
          name: productData.name,
          slug: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: productData.description || productData.name,
          shortDescription: productData.shortDescription,
          sku: productData.sku,
          price: parseFloat(productData.price),
          discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : undefined,
          category: category._id,
          brand: productData.brand,
          stock: {
            quantity: parseInt(productData.countInStock) || 0,
            lowStockThreshold: 10,
            trackQuantity: true
          },
          attributes: {
            color: productData.color,
            size: productData.size ? productData.size.split('|') : undefined,
            material: productData.material
          },
          tags: productData.tags ? productData.tags.split('|') : undefined,
          status: 'active',
          storeId: req.storeId
        });

        successCount++;
        results.push(product);

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      message: `Bulk upload completed. ${successCount} products created.`,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 10), // Limit errors shown
      products: results
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getPublicProducts,
  getPublicProductsByCategory,
  getProductsByCategory,
  searchProducts,
  updateProductStock,
  bulkUpdateProducts,
  getProductStats,
  recalculateCategoryProductCounts,
  bulkUploadProducts
};