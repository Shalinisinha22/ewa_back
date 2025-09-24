const FooterSettings = require('../models/FooterSettings');

// @desc    Get footer settings
// @route   GET /api/footer
// @access  Private
const getFooterSettings = async (req, res) => {
  try {
    const footerSettings = await FooterSettings.findOne({
      storeId: req.storeId,
      isActive: true
    });

    if (!footerSettings) {
      // Create default footer settings if none exist
      const defaultFooterSettings = await FooterSettings.create({
        storeId: req.storeId,
        createdBy: req.admin._id
      });

      return res.json(defaultFooterSettings);
    }

    res.json(footerSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public footer settings
// @route   GET /api/footer/public
// @access  Public
const getPublicFooterSettings = async (req, res) => {
  try {
    const { storeId, store } = req.query;

    if (!storeId && !store) {
      return res.status(400).json({ message: 'Store identification is required' });
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
          { slug: store },
          { name: { $regex: store, $options: 'i' } }
        ]
      });
      if (!storeDoc) {
        return res.status(404).json({ message: 'Store not found' });
      }
      query.storeId = storeDoc._id;
    }

    const footerSettings = await FooterSettings.findOne(query);

    if (!footerSettings) {
      // Return default footer settings if none exist
      return res.json({
        contactInfo: {
          address: 'Kankarbagh, Patna, Bihar',
          email: 'support@ewa.com',
          phone: '(+91) 9999999999'
        },
        socialLinks: {
          facebook: '',
          instagram: '',
          twitter: '',
          pinterest: ''
        },
        mapSettings: {
          embedCode: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.8974!2d85.1376!3d25.5941!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f29937c52d4f05%3A0x831a0e05f607b270!2sKankarbagh%2C%20Patna%2C%20Bihar!5e0!3m2!1sen!2sin!4v1635000000000!5m2!1sen!2sin',
          showMap: true
        },
        copyright: {
          text: 'Copyright © 2025 EWA. All rights reserved.',
          year: new Date().getFullYear()
        }
      });
    }

    res.json(footerSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update footer settings
// @route   PUT /api/footer
// @access  Private
const updateFooterSettings = async (req, res) => {
  try {
    let footerSettings = await FooterSettings.findOne({
      storeId: req.storeId,
      isActive: true
    });

    const updateData = {
      ...req.body,
      storeId: req.storeId,
      lastModifiedBy: req.admin._id
    };

    if (footerSettings) {
      // Update existing settings
      Object.assign(footerSettings, updateData);
      await footerSettings.save();
    } else {
      // Create new settings
      updateData.createdBy = req.admin._id;
      footerSettings = await FooterSettings.create(updateData);
    }

    res.json(footerSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reset footer settings to default
// @route   POST /api/footer/reset
// @access  Private
const resetFooterSettings = async (req, res) => {
  try {
    // Delete existing footer settings
    await FooterSettings.findOneAndDelete({
      storeId: req.storeId,
      isActive: true
    });

    // Create default footer settings
    const defaultFooterSettings = await FooterSettings.create({
      storeId: req.storeId,
      createdBy: req.admin._id
    });

    res.json({
      message: 'Footer settings reset to default',
      footerSettings: defaultFooterSettings
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getFooterSettings,
  getPublicFooterSettings,
  updateFooterSettings,
  resetFooterSettings
};

