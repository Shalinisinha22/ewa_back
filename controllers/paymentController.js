const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

// Initialize Razorpay instance (will be set per store)
let razorpayInstance = null;

const initializeRazorpay = (keyId, keySecret) => {
    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });
};

// @desc    Create Razorpay order
// @route   POST /api/payment/razorpay/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', orderData } = req.body;

        // Get store's Razorpay settings
        // You'll need to implement this based on your store settings model
        // For now, using environment variables as fallback
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay credentials not configured'
            });
        }

        // Initialize Razorpay
        razorpayInstance = initializeRazorpay(razorpayKeyId, razorpayKeySecret);

        const options = {
            amount: amount, // amount in paise
            currency: currency,
            receipt: `order_${Date.now()}`,
            notes: {
                storeId: req.storeId,
                customerEmail: orderData.billing.email,
                itemCount: orderData.items.length
            }
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: razorpayKeyId
        });

    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData
        } = req.body;

        // Get Razorpay key secret
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpayKeySecret) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay credentials not configured'
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Payment verified successfully, create order in database
        const order = await Order.create({
            ...orderData,
            storeId: req.storeId,
            payment: {
                ...orderData.payment,
                method: 'Razorpay',
                status: 'completed',
                transactionId: razorpay_payment_id,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature
            },
            status: 'confirmed'
        });

        res.json({
            success: true,
            message: 'Payment verified successfully',
            order: order
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/payment/razorpay/webhook
// @access  Public
const handleRazorpayWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            return res.status(400).json({ message: 'Webhook secret not configured' });
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== webhookSignature) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const { event, payload } = req.body;

        switch (event) {
            case 'payment.captured':
                // Handle successful payment
                await handlePaymentCaptured(payload.payment.entity);
                break;
            case 'payment.failed':
                // Handle failed payment
                await handlePaymentFailed(payload.payment.entity);
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

const handlePaymentCaptured = async (payment) => {
    try {
        // Find order by razorpay order id
        const order = await Order.findOne({
            'payment.razorpayOrderId': payment.order_id
        });

        if (order) {
            order.payment.status = 'completed';
            order.status = 'confirmed';
            await order.save();
            console.log(`Payment captured for order: ${order._id}`);
        }
    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
};

const handlePaymentFailed = async (payment) => {
    try {
        // Find order by razorpay order id
        const order = await Order.findOne({
            'payment.razorpayOrderId': payment.order_id
        });

        if (order) {
            order.payment.status = 'failed';
            order.status = 'cancelled';
            await order.save();
            console.log(`Payment failed for order: ${order._id}`);
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

module.exports = {
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook
};

