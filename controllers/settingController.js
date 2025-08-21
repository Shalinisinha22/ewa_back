const Store = require('../models/Store');
const ShippingSettings = require('../models/Shipping');
const TaxSettings = require('../models/Tax');
const PaymentGateway = require('../models/Payment');

// @desc    Get store settings
// @route   GET /api/settings/store
// @access  Private
const getStoreSettings = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update store settings
// @route   PUT /api/settings/store
// @access  Private
const updateStoreSettings = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Update store fields
    Object.assign(store, req.body);
    const updatedStore = await store.save();

    res.json(updatedStore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get payment settings
// @route   GET /api/settings/payment
// @access  Private
const getPaymentSettings = async (req, res) => {
  try {
    const paymentGateways = await PaymentGateway.find({ storeId: req.storeId });
    
    if (paymentGateways.length === 0) {
      // Create default payment gateways for the store
      const defaultGateways = [
        {
          storeId: req.storeId,
          name: 'Razorpay',
          isActive: false,
          testMode: true,
          description: 'Accept payments through Razorpay',
          credentials: {
            keyId: '',
            keySecret: '',
            webhookSecret: ''
          }
        },
        {
          storeId: req.storeId,
          name: 'Stripe',
          isActive: false,
          testMode: true,
          description: 'Accept payments through Stripe',
          credentials: {
            publishableKey: '',
            secretKey: '',
            webhookSecret: ''
          }
        },
        {
          storeId: req.storeId,
          name: 'PayU',
          isActive: false,
          testMode: true,
          description: 'Accept payments through PayU',
          credentials: {
            merchantId: '',
            merchantKey: '',
            salt: ''
          }
        },
        {
          storeId: req.storeId,
          name: 'Cash on Delivery',
          isActive: true,
          testMode: false,
          description: 'Accept cash payments on delivery',
          credentials: {
            maxAmount: 5000,
            charges: 25
          }
        },
        {
          storeId: req.storeId,
          name: 'PayPal',
          isActive: false,
          testMode: true,
          description: 'Accept payments through PayPal',
          credentials: {
            clientId: '',
            clientSecret: '',
            mode: 'sandbox'
          }
        }
      ];
      
      await PaymentGateway.insertMany(defaultGateways);
      const newGateways = await PaymentGateway.find({ storeId: req.storeId });
      res.json(newGateways);
    } else {
      res.json(paymentGateways);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment settings
// @route   PUT /api/settings/payment
// @access  Private
const updatePaymentSettings = async (req, res) => {
  try {
    const { gatewayId, ...updateData } = req.body;
    
    if (gatewayId) {
      // Update specific payment gateway
      const paymentGateway = await PaymentGateway.findOneAndUpdate(
        { _id: gatewayId, storeId: req.storeId },
        updateData,
        { new: true }
      );
      
      if (!paymentGateway) {
        return res.status(404).json({ message: 'Payment gateway not found' });
      }
      
      res.json(paymentGateway);
    } else {
      // Create new payment gateway
      const newPaymentGateway = new PaymentGateway({
        storeId: req.storeId,
        ...updateData
      });
      
      const savedGateway = await newPaymentGateway.save();
      res.json(savedGateway);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get shipping settings
// @route   GET /api/settings/shipping
// @access  Private
const getShippingSettings = async (req, res) => {
  try {
    let shippingSettings = await ShippingSettings.findOne({ storeId: req.storeId });
    
    if (!shippingSettings) {
      // Create default shipping settings for the store
      shippingSettings = new ShippingSettings({
        storeId: req.storeId,
        freeShippingThreshold: 500,
        defaultShippingCost: 50,
        zones: [
          {
            name: 'Local',
            minWeight: 0,
            maxWeight: 1,
            rate: 30,
            estimatedDays: '1-2 days',
            codAvailable: true,
            codCharges: 25
          },
          {
            name: 'National',
            minWeight: 0,
            maxWeight: 1,
            rate: 80,
            estimatedDays: '3-5 days',
            codAvailable: false,
            codCharges: 0
          }
        ]
      });
      await shippingSettings.save();
    }

    res.json(shippingSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/settings/shipping
// @access  Private
const updateShippingSettings = async (req, res) => {
  try {
    let shippingSettings = await ShippingSettings.findOne({ storeId: req.storeId });
    
    if (!shippingSettings) {
      shippingSettings = new ShippingSettings({
        storeId: req.storeId,
        ...req.body
      });
    } else {
      Object.assign(shippingSettings, req.body);
    }
    
    const updatedSettings = await shippingSettings.save();
    res.json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get tax settings
// @route   GET /api/settings/tax
// @access  Private
const getTaxSettings = async (req, res) => {
  try {
    const taxSettings = await TaxSettings.find({ storeId: req.storeId });
    
    if (taxSettings.length === 0) {
      // Create default tax settings for the store
      const defaultTaxes = [
        {
          storeId: req.storeId,
          name: 'GST',
          rate: 18,
          isActive: true,
          description: 'Goods and Services Tax'
        },
        {
          storeId: req.storeId,
          name: 'CGST',
          rate: 9,
          isActive: false,
          description: 'Central Goods and Services Tax'
        },
        {
          storeId: req.storeId,
          name: 'SGST',
          rate: 9,
          isActive: false,
          description: 'State Goods and Services Tax'
        }
      ];
      
      await TaxSettings.insertMany(defaultTaxes);
      const newTaxSettings = await TaxSettings.find({ storeId: req.storeId });
      res.json(newTaxSettings);
    } else {
      res.json(taxSettings);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update tax settings
// @route   PUT /api/settings/tax
// @access  Private
const updateTaxSettings = async (req, res) => {
  try {
    const { taxId, ...updateData } = req.body;
    
    if (taxId) {
      // Update specific tax setting
      const taxSetting = await TaxSettings.findOneAndUpdate(
        { _id: taxId, storeId: req.storeId },
        updateData,
        { new: true }
      );
      
      if (!taxSetting) {
        return res.status(404).json({ message: 'Tax setting not found' });
      }
      
      res.json(taxSetting);
    } else {
      // Create new tax setting
      const newTaxSetting = new TaxSettings({
        storeId: req.storeId,
        ...updateData
      });
      
      const savedTaxSetting = await newTaxSetting.save();
      res.json(savedTaxSetting);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get email settings
// @route   GET /api/settings/email
// @access  Private
const getEmailSettings = async (req, res) => {
  try {
    // Return default email settings
    const emailSettings = {
      smtp: {
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: ''
      },
      templates: {
        orderConfirmation: {
          enabled: true,
          subject: 'Order Confirmation - #{orderNumber}'
        },
        orderShipped: {
          enabled: true,
          subject: 'Your order has been shipped - #{orderNumber}'
        },
        orderDelivered: {
          enabled: true,
          subject: 'Order delivered - #{orderNumber}'
        }
      }
    };

    res.json(emailSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update email settings
// @route   PUT /api/settings/email
// @access  Private
const updateEmailSettings = async (req, res) => {
  try {
    // In a real app, you'd store email settings securely
    res.json({ message: 'Email settings updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get SEO settings
// @route   GET /api/settings/seo
// @access  Private
const getSEOSettings = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json(store.seo || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update SEO settings
// @route   PUT /api/settings/seo
// @access  Private
const updateSEOSettings = async (req, res) => {
  try {
    const store = await Store.findById(req.storeId);
    
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    store.seo = { ...store.seo, ...req.body };
    const updatedStore = await store.save();

    res.json(updatedStore.seo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete tax setting
// @route   DELETE /api/settings/tax/:id
// @access  Private
const deleteTaxSetting = async (req, res) => {
  try {
    const taxSetting = await TaxSettings.findOneAndDelete({
      _id: req.params.id,
      storeId: req.storeId
    });
    
    if (!taxSetting) {
      return res.status(404).json({ message: 'Tax setting not found' });
    }
    
    res.json({ message: 'Tax setting deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete payment gateway
// @route   DELETE /api/settings/payment/:id
// @access  Private
const deletePaymentGateway = async (req, res) => {
  try {
    const paymentGateway = await PaymentGateway.findOneAndDelete({
      _id: req.params.id,
      storeId: req.storeId
    });
    
    if (!paymentGateway) {
      return res.status(404).json({ message: 'Payment gateway not found' });
    }
    
    res.json({ message: 'Payment gateway deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
  getPaymentSettings,
  updatePaymentSettings,
  deletePaymentGateway,
  getShippingSettings,
  updateShippingSettings,
  getTaxSettings,
  updateTaxSettings,
  deleteTaxSetting,
  getEmailSettings,
  updateEmailSettings,
  getSEOSettings,
  updateSEOSettings
};