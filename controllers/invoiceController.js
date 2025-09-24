const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Store = require('../models/Store');

// @desc    Generate invoice for an order
// @route   POST /api/invoices/generate
// @access  Private
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Find the order
    const order = await Order.findById(orderId)
      .populate('customer', 'firstName lastName email')
      .populate('storeId', 'name email phone address');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: orderId });
    if (existingInvoice) {
      return res.json({
        message: 'Invoice already exists',
        invoice: existingInvoice
      });
    }

    // Create invoice data from order
    const invoiceData = {
      orderId: order._id,
      storeId: order.storeId._id,
      customer: order.customer._id,
      items: order.items.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        taxRate: 0, // Can be calculated based on product or tax settings
        taxAmount: 0
      })),
      billing: order.billing,
      shipping: order.shipping,
      payment: order.payment,
      pricing: order.pricing,
      status: order.payment.status === 'completed' ? 'paid' : 'sent',
      metadata: {
        generatedBy: req.admin ? req.admin._id : null,
        template: 'default'
      }
    };

    // Create the invoice
    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Populate the invoice for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'firstName lastName email')
      .populate('storeId', 'name email phone address');

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice: populatedInvoice
    });

  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'firstName lastName email')
      .populate('storeId', 'name email phone address')
      .populate('orderId', 'orderNumber status');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer invoice by order ID
// @route   GET /api/invoices/order/:orderId
// @access  Private (Customer)
const getCustomerInvoiceByOrderId = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      orderId: req.params.orderId,
      customer: req.customer._id,
      storeId: req.customer.storeId
    })
    .populate('customer', 'firstName lastName email')
    .populate('storeId', 'name email phone address')
    .populate('orderId', 'orderNumber status fulfillment');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get customer invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download invoice as PDF
// @route   GET /api/invoices/:id/download
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    console.log('downloadInvoice controller called with params:', req.params);
    console.log('Customer:', req.customer ? 'Present' : 'Missing');
    console.log('Store ID:', req.storeId);
    
    let invoice;
    
    // Check if this is a customer route (order/:orderId/download) or admin route (/:id/download)
    if (req.params.orderId) {
      // Customer route - find invoice by order ID
      const query = { 
        orderId: req.params.orderId,
        customer: req.customer._id,
        storeId: req.customer.storeId
      };
      
      console.log('Looking for invoice with query:', JSON.stringify(query, null, 2));
      
      invoice = await Invoice.findOne(query)
      .populate('customer', 'firstName lastName email')
      .populate('storeId', 'name email phone address logo')
      .populate('orderId', 'orderNumber status fulfillment');
      
      console.log('Invoice found:', invoice ? 'Yes' : 'No');
      if (invoice) {
        console.log('Invoice details:', {
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          customer: invoice.customer,
          storeId: invoice.storeId
        });
      }
    } else {
      // Admin route - find invoice by ID
      invoice = await Invoice.findById(req.params.id)
        .populate('customer', 'firstName lastName email')
        .populate('storeId', 'name email phone address logo')
        .populate('orderId', 'orderNumber status fulfillment');
    }

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate HTML content for the invoice
    const htmlContent = generateInvoiceHTML(invoice);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    // For now, return HTML content (you can integrate with PDF generation libraries like puppeteer)
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate invoice for existing order (Customer)
// @route   POST /api/invoices/order/:orderId/generate
// @access  Private (Customer)
const generateInvoiceForOrder = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Invoice = require('../models/Invoice');
    
    // Find the order
    const order = await Order.findOne({
      _id: req.params.orderId,
      customer: req.customer._id,
      storeId: req.customer.storeId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if invoice already exists
    const existingInvoice = await Invoice.findOne({ orderId: order._id });
    if (existingInvoice) {
      return res.status(400).json({ message: 'Invoice already exists for this order' });
    }

    // Create invoice data from order
    const invoiceData = {
      orderId: order._id,
      storeId: order.storeId,
      customer: order.customer,
      items: order.items.map(item => ({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        taxRate: 0,
        taxAmount: 0
      })),
      billing: order.billing,
      shipping: order.shipping,
      payment: order.payment,
      pricing: order.pricing,
      status: order.payment.status === 'completed' ? 'paid' : 'sent',
      metadata: {
        generatedBy: null, // System generated
        template: 'default'
      }
    };

    // Create the invoice
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    console.log(`Invoice generated for order ${order.orderNumber}`);
    res.status(201).json({ message: 'Invoice generated successfully', invoice });
  } catch (error) {
    console.error('Generate invoice for order error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all invoices for a store
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { storeId: req.storeId };

    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.customer) {
      query.customer = req.query.customer;
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('orderId', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      page,
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate invoice HTML
const generateInvoiceHTML = (invoice) => {
  const store = invoice.storeId;
  const customer = invoice.customer;
  const order = invoice.orderId;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                border-bottom: 2px solid #e5e5e5;
                padding-bottom: 20px;
            }
            .store-info h1 {
                color: #2c3e50;
                margin: 0 0 10px 0;
                font-size: 28px;
            }
            .store-info p {
                margin: 5px 0;
                color: #666;
            }
            .invoice-info {
                text-align: right;
            }
            .invoice-info h2 {
                color: #2c3e50;
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            .billing-info, .shipping-info {
                flex: 1;
                margin-right: 20px;
            }
            .billing-info h3, .shipping-info h3 {
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 18px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            .items-table th, .items-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .items-table th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #2c3e50;
            }
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            .totals-section {
                text-align: right;
                margin-top: 20px;
            }
            .totals-table {
                width: 300px;
                margin-left: auto;
                border-collapse: collapse;
            }
            .totals-table td {
                padding: 8px 12px;
                border-bottom: 1px solid #ddd;
            }
            .totals-table .total-row {
                font-weight: bold;
                font-size: 18px;
                background-color: #f8f9fa;
                color: #2c3e50;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e5e5;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-pending { background-color: #fff3cd; color: #856404; }
            .status-completed { background-color: #d4edda; color: #155724; }
            .status-paid { background-color: #d1ecf1; color: #0c5460; }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="store-info">
                    <h1>${store.name}</h1>
                    <p>${store.address || 'Store Address'}</p>
                    <p>Email: ${store.email || 'N/A'}</p>
                    <p>Phone: ${store.phone || 'N/A'}</p>
                </div>
                <div class="invoice-info">
                    <h2>Invoice ${invoice.invoiceNumber}</h2>
                    <p><strong>Order:</strong> ${order ? order.orderNumber : 'N/A'}</p>
                    <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p>
                    <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
                    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>

            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To:</h3>
                    <p><strong>${customer.firstName} ${customer.lastName}</strong></p>
                    <p>${customer.email}</p>
                    <p>${invoice.billing.address.line1}</p>
                    ${invoice.billing.address.line2 ? `<p>${invoice.billing.address.line2}</p>` : ''}
                    <p>${invoice.billing.address.city}, ${invoice.billing.address.state}</p>
                    <p>${invoice.billing.address.country} - ${invoice.billing.address.zipCode}</p>
                </div>
                <div class="shipping-info">
                    <h3>Ship To:</h3>
                    <p><strong>${invoice.shipping.firstName} ${invoice.shipping.lastName}</strong></p>
                    <p>${invoice.shipping.address.line1}</p>
                    ${invoice.shipping.address.line2 ? `<p>${invoice.shipping.address.line2}</p>` : ''}
                    <p>${invoice.shipping.address.city}, ${invoice.shipping.address.state}</p>
                    <p>${invoice.shipping.address.country} - ${invoice.shipping.address.zipCode}</p>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.unitPrice.toFixed(2)}</td>
                            <td>₹${item.totalPrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td>₹${invoice.pricing.subtotal.toFixed(2)}</td>
                    </tr>
                    ${invoice.pricing.tax > 0 ? `
                    <tr>
                        <td>Tax:</td>
                        <td>₹${invoice.pricing.tax.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${invoice.pricing.shipping > 0 ? `
                    <tr>
                        <td>Shipping:</td>
                        <td>₹${invoice.pricing.shipping.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    ${invoice.pricing.discount > 0 ? `
                    <tr>
                        <td>Discount:</td>
                        <td>-₹${invoice.pricing.discount.toFixed(2)}</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td>Total:</td>
                        <td>₹${invoice.pricing.total.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <p>Payment Method: ${invoice.payment.method.toUpperCase()}</p>
                <p>Payment Status: <span class="status-badge status-${invoice.payment.status}">${invoice.payment.status}</span></p>
                ${invoice.notes.customer ? `<p><strong>Notes:</strong> ${invoice.notes.customer}</p>` : ''}
                <p>Thank you for your business!</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateInvoice,
  getInvoiceById,
  getCustomerInvoiceByOrderId,
  downloadInvoice,
  generateInvoiceForOrder,
  getInvoices
};
