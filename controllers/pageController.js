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
      currentPage: page,
      totalPages: Math.ceil(total / limit),
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

// @desc    Get page by type (public endpoint)
// @route   GET /api/pages/public/type/:type
// @access  Public
const getPageByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { storeId, store } = req.query;

    if (!storeId && !store) {
      return res.status(400).json({ message: 'Store identification is required' });
    }

    let query = { 
      type: type,
      status: 'published'
    };

    if (storeId) {
      query.storeId = storeId;
    } else if (store) {
      // Find store by name or slug
      const Store = require('../models/Store');
      const storeDoc = await Store.findOne({ 
        $or: [
          { name: store },
          { slug: store },
          { name: { $regex: store, $options: 'i' } }
        ]
      });
      if (!storeDoc) {
        return res.status(404).json({ message: 'Store not found' });
      }
      query.storeId = storeDoc._id;
    }

    const page = await Page.findOne(query)
      .populate('author', 'name')
      .select('-customFields'); // Exclude sensitive fields

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

// @desc    Get all public pages
// @route   GET /api/pages/public
// @access  Public
const getPublicPages = async (req, res) => {
  try {
    const { storeId, store } = req.query;

    if (!storeId && !store) {
      return res.status(400).json({ message: 'Store identification is required' });
    }

    let query = { 
      status: 'published'
    };

    if (storeId) {
      query.storeId = storeId;
    } else if (store) {
      // Find store by name or slug
      const Store = require('../models/Store');
      const storeDoc = await Store.findOne({ 
        $or: [
          { name: store },
          { slug: store },
          { name: { $regex: store, $options: 'i' } }
        ]
      });
      if (!storeDoc) {
        return res.status(404).json({ message: 'Store not found' });
      }
      query.storeId = storeDoc._id;
    }

    const pages = await Page.find(query)
      .populate('author', 'name')
      .select('title type content seo createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create default pages for a store
// @route   POST /api/pages/create-defaults
// @access  Private
const createDefaultPages = async (req, res) => {
  try {
    const defaultPages = [
      {
        title: 'About Us',
        type: 'about',
        content: `
          <h2>Welcome to EWA Fashion</h2>
          <p>We are a premier fashion destination committed to bringing you the latest trends and timeless classics in clothing and accessories.</p>
          
          <h3>Our Mission</h3>
          <p>To provide high-quality fashion that empowers individuals to express their unique style while maintaining affordable prices and sustainable practices.</p>
          
          <h3>Our Vision</h3>
          <p>To become the most trusted and loved fashion destination, known for our quality, style, and commitment to customer satisfaction.</p>
          
          <h3>Why Choose Us?</h3>
          <ul>
            <li>Curated selection of premium fashion items</li>
            <li>Affordable prices without compromising quality</li>
            <li>Fast and reliable shipping</li>
            <li>Excellent customer service</li>
            <li>Easy returns and exchanges</li>
          </ul>
        `,
        seo: {
          metaDescription: 'Learn about EWA Fashion - your premier destination for quality fashion, latest trends, and exceptional customer service.'
        },
        status: 'published'
      },
      {
        title: 'Privacy Policy',
        type: 'privacy',
        content: `
          <h2>Privacy Policy</h2>
          <p>Last updated: ${new Date().toLocaleDateString()}</p>
          
          <h3>Information We Collect</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul>
            <li>Your name, email address, and contact information</li>
            <li>Shipping and billing addresses</li>
            <li>Payment information (processed securely through our payment partners)</li>
            <li>Order history and preferences</li>
            <li>Account information and login credentials</li>
          </ul>
          
          <h3>How We Use Your Information</h3>
          <ul>
            <li>To process your orders and payments</li>
            <li>To communicate with you about your orders and our services</li>
            <li>To send you marketing communications (with your consent)</li>
            <li>To improve our website and services</li>
            <li>To prevent fraud and ensure security</li>
          </ul>
          
          <h3>Information Sharing</h3>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li>With service providers who assist us in operating our website and conducting business</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a business transfer or acquisition</li>
          </ul>
          
          <h3>Data Security</h3>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h3>Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@ewafashion.com</p>
        `,
        seo: {
          metaDescription: 'Read our Privacy Policy to understand how we collect, use, and protect your personal information at EWA Fashion.'
        },
        status: 'published'
      },
      {
        title: 'Terms & Conditions',
        type: 'terms',
        content: `
          <h2>Terms & Conditions</h2>
          <p>Last updated: ${new Date().toLocaleDateString()}</p>
          
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
          
          <h3>2. Use License</h3>
          <p>Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.</p>
          
          <h3>3. Product Information</h3>
          <p>We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.</p>
          
          <h3>4. Orders and Payment</h3>
          <ul>
            <li>All orders are subject to acceptance and availability</li>
            <li>Prices are subject to change without notice</li>
            <li>Payment must be received before order processing</li>
            <li>We accept major credit cards and other approved payment methods</li>
          </ul>
          
          <h3>5. Shipping and Delivery</h3>
          <ul>
            <li>Shipping costs are calculated at checkout</li>
            <li>Delivery times are estimates and may vary</li>
            <li>Risk of loss transfers to you upon delivery</li>
            <li>We are not responsible for delays caused by shipping carriers</li>
          </ul>
          
          <h3>6. Returns and Exchanges</h3>
          <ul>
            <li>Items must be returned within 30 days of purchase</li>
            <li>Items must be in original condition with tags attached</li>
            <li>Return shipping costs are the customer's responsibility unless the item is defective</li>
            <li>Refunds will be processed within 5-7 business days</li>
          </ul>
          
          <h3>7. Limitation of Liability</h3>
          <p>In no event shall EWA Fashion or its suppliers be liable for any damages arising out of the use or inability to use the materials on this website.</p>
          
          <h3>8. Governing Law</h3>
          <p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which our business operates.</p>
          
          <h3>Contact Information</h3>
          <p>For questions about these Terms & Conditions, please contact us at legal@ewafashion.com</p>
        `,
        seo: {
          metaDescription: 'Read our Terms & Conditions to understand the rules and regulations for using EWA Fashion website and services.'
        },
        status: 'published'
      },
      {
        title: 'Shipping Policy',
        type: 'shipping',
        content: `
          <h2>Shipping Policy</h2>
          <p>Last updated: ${new Date().toLocaleDateString()}</p>
          
          <h3>Shipping Information</h3>
          <p>We are committed to delivering your orders quickly and safely. Please review our shipping policy below for detailed information about delivery times, costs, and procedures.</p>
          
          <h3>Shipping Methods & Delivery Times</h3>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h4>Standard Shipping (5-7 Business Days)</h4>
            <ul>
              <li>Free shipping on orders over $75</li>
              <li>$5.99 shipping fee for orders under $75</li>
              <li>Available for all domestic addresses</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h4>Express Shipping (2-3 Business Days)</h4>
            <ul>
              <li>$12.99 shipping fee</li>
              <li>Available for most domestic addresses</li>
              <li>Order by 2 PM for same-day processing</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h4>Overnight Shipping (1 Business Day)</h4>
            <ul>
              <li>$24.99 shipping fee</li>
              <li>Available for select areas only</li>
              <li>Order by 12 PM for next-day delivery</li>
            </ul>
          </div>
          
          <h3>International Shipping</h3>
          <p>We currently ship to select international destinations. International shipping costs vary by location and are calculated at checkout. Delivery times range from 7-21 business days depending on the destination.</p>
          <p>Please note that international orders may be subject to customs duties and taxes, which are the responsibility of the customer.</p>
          
          <h3>Order Processing</h3>
          <ul>
            <li>Orders are processed Monday through Friday, excluding holidays</li>
            <li>Orders placed after 2 PM will be processed the next business day</li>
            <li>You will receive a confirmation email once your order ships</li>
            <li>Tracking information will be provided via email</li>
          </ul>
          
          <h3>Shipping Restrictions</h3>
          <p>We cannot ship to P.O. boxes for express or overnight delivery. Some items may have shipping restrictions due to size, weight, or destination. Any restrictions will be noted on the product page.</p>
          
          <h3>Damaged or Lost Packages</h3>
          <p>If your package arrives damaged or is lost in transit, please contact our customer service team within 48 hours of the expected delivery date. We will work with the shipping carrier to resolve the issue and ensure you receive your order.</p>
          
          <h3>Contact Information</h3>
          <p>For questions about shipping or to track your order, please contact us:</p>
          <ul>
            <li>Email: support@ewafashion.com</li>
            <li>Phone: (+91) 9999999999</li>
            <li>Hours: Monday-Friday, 9 AM - 6 PM IST</li>
          </ul>
        `,
        seo: {
          metaDescription: 'Learn about our shipping options, delivery times, and policies at EWA Fashion. Fast and reliable shipping worldwide.'
        },
        status: 'published'
      },
      {
        title: 'Return & Refund Policy',
        type: 'refund',
        content: `
          <h2>Return & Refund Policy</h2>
          <p>Last updated: ${new Date().toLocaleDateString()}</p>
          
          <h3>Our Return Policy</h3>
          <p>We want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help with easy returns and exchanges.</p>
          
          <h3>Return Timeframe</h3>
          <ul>
            <li>Items must be returned within 30 days of delivery</li>
            <li>The return period starts from the date you receive your order</li>
            <li>Items must be in original condition with all tags attached</li>
          </ul>
          
          <h3>What Can Be Returned</h3>
          <ul>
            <li>Unworn clothing with original tags</li>
            <li>Unused accessories in original packaging</li>
            <li>Items that are defective or damaged upon arrival</li>
            <li>Items that don't match the product description</li>
          </ul>
          
          <h3>What Cannot Be Returned</h3>
          <ul>
            <li>Items worn, washed, or altered</li>
            <li>Items without original tags or packaging</li>
            <li>Items damaged by customer misuse</li>
            <li>Custom or personalized items</li>
            <li>Items marked as final sale</li>
          </ul>
          
          <h3>How to Return</h3>
          <ol>
            <li>Contact our customer service team to initiate a return</li>
            <li>We'll provide you with a return authorization number</li>
            <li>Package the items securely in the original packaging</li>
            <li>Include the return form with your package</li>
            <li>Ship the package using a trackable method</li>
          </ol>
          
          <h3>Return Shipping</h3>
          <ul>
            <li>Return shipping costs are the customer's responsibility</li>
            <li>We recommend using a trackable shipping method</li>
            <li>We're not responsible for items lost during return shipping</li>
            <li>Free return shipping is provided for defective items</li>
          </ul>
          
          <h3>Refund Process</h3>
          <ul>
            <li>Refunds are processed within 5-7 business days after we receive your return</li>
            <li>Refunds are issued to the original payment method</li>
            <li>Processing fees may apply for certain payment methods</li>
            <li>You'll receive an email confirmation when your refund is processed</li>
          </ul>
          
          <h3>Exchanges</h3>
          <ul>
            <li>Exchanges are subject to item availability</li>
            <li>Size exchanges are free of charge</li>
            <li>Color or style exchanges may incur additional charges</li>
            <li>Exchange shipping costs are the customer's responsibility</li>
          </ul>
          
          <h3>International Returns</h3>
          <p>International customers are responsible for return shipping costs and any customs duties or taxes. We recommend checking with your local customs office before shipping returns.</p>
          
          <h3>Contact Us</h3>
          <p>For questions about returns or to initiate a return, please contact us:</p>
          <ul>
            <li>Email: returns@ewafashion.com</li>
            <li>Phone: (+91) 9999999999</li>
            <li>Hours: Monday-Friday, 9 AM - 6 PM IST</li>
          </ul>
        `,
        seo: {
          metaDescription: 'Learn about our return and refund policy at EWA Fashion. Easy returns within 30 days for your satisfaction.'
        },
        status: 'published'
      }
    ];

    const createdPages = [];
    
    for (const pageData of defaultPages) {
      // Check if page already exists
      const existingPage = await Page.findOne({
        storeId: req.storeId,
        type: pageData.type
      });

      if (!existingPage) {
        const page = await Page.create({
          ...pageData,
          storeId: req.storeId,
          author: req.admin._id
        });
        createdPages.push(page);
      }
    }

    res.json({
      message: `Created ${createdPages.length} default pages`,
      pages: createdPages
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
  getPageStats,
  getPageByType,
  getPublicPages,
  createDefaultPages
};