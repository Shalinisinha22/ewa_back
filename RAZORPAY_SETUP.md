# Razorpay Payment Gateway Setup

This guide will help you set up Razorpay payment gateway integration for your EWA Fashion store.

## Prerequisites

1. A Razorpay account (sign up at https://razorpay.com)
2. Test/Live API credentials from Razorpay Dashboard

## Environment Variables Setup

Add the following environment variables to your `.env` file or Vercel environment variables:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Getting Razorpay Credentials

1. **Login to Razorpay Dashboard**: Go to https://dashboard.razorpay.com
2. **Navigate to Settings**: Click on Settings in the left sidebar
3. **API Keys**: Go to API Keys section
4. **Generate Keys**: 
   - For testing: Use Test Mode keys (starts with `rzp_test_`)
   - For production: Use Live Mode keys (starts with `rzp_live_`)
5. **Copy Credentials**:
   - Key ID: `rzp_test_xxxxxxxxxx`
   - Key Secret: `xxxxxxxxxx` (keep this secret!)

### Webhook Setup (Optional but Recommended)

1. **Go to Webhooks**: In Razorpay Dashboard → Settings → Webhooks
2. **Create Webhook**: Click "Create New Webhook"
3. **Webhook URL**: `https://your-backend-domain.com/api/payment/razorpay/webhook`
4. **Events**: Select these events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. **Secret**: Generate a webhook secret and add to `RAZORPAY_WEBHOOK_SECRET`

## Vercel Deployment Setup

If deploying on Vercel, add these environment variables in your Vercel dashboard:

1. Go to your project on Vercel
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret  
   - `RAZORPAY_WEBHOOK_SECRET`: Your webhook secret (if using webhooks)

## Store Configuration

In your admin panel, make sure to configure Razorpay as a payment method:

1. **Payment Settings**: Go to Store Settings → Payment Methods
2. **Add Razorpay**: 
   - Name: "Razorpay"
   - Status: Active
   - Credentials:
     - `keyId`: Your Razorpay Key ID
     - `keySecret`: Your Razorpay Key Secret
3. **Save Configuration**

## Testing

### Test Card Details (Use these for testing)

**Credit Cards:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3 digits (e.g., `123`)

**Debit Cards:**
- Card Number: `5555 5555 5555 4444`
- Expiry: Any future date
- CVV: Any 3 digits

**UPI:**
- UPI ID: `success@razorpay` (for successful payment)
- UPI ID: `failure@razorpay` (for failed payment)

### Test Payment Flow

1. Add products to cart
2. Go to checkout
3. Fill in address details
4. Select "Razorpay" as payment method
5. Click "Pay Now"
6. Use test credentials above
7. Verify payment success/failure

## Production Checklist

Before going live:

- [ ] Switch to Live Mode API keys in Razorpay Dashboard
- [ ] Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live credentials
- [ ] Set up webhook with production URL
- [ ] Test with small amount using real payment method
- [ ] Verify webhook notifications are working
- [ ] Set up proper error handling and logging
- [ ] Configure payment failure retry logic

## Security Notes

1. **Never expose Key Secret**: Keep `RAZORPAY_KEY_SECRET` secure and never commit to code
2. **Webhook Verification**: Always verify webhook signatures
3. **HTTPS Only**: Use HTTPS for all payment-related endpoints
4. **Validate Amounts**: Always verify payment amounts on backend
5. **Order Verification**: Verify order details before processing

## Troubleshooting

### Common Issues

1. **"Razorpay payment not available"**
   - Check if Razorpay is configured in store settings
   - Verify credentials are set correctly

2. **"Payment verification failed"**
   - Check if webhook secret matches
   - Verify signature calculation

3. **"Failed to load payment gateway"**
   - Check if Razorpay script is loading
   - Verify internet connection

4. **Orders not updating after payment**
   - Check webhook configuration
   - Verify webhook URL is accessible
   - Check server logs for webhook errors

### Support

For Razorpay-specific issues:
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For integration issues:
- Check server logs
- Verify API responses
- Test with Razorpay's test environment








