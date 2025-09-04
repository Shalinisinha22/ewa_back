# Brevo Email Service Setup Guide

## ✅ What's Already Done

1. **Brevo SDK Installed**: `@getbrevo/brevo` package is installed
2. **Email Service Created**: `utils/brevoEmailService.js` with full functionality
3. **Controller Updated**: Forgot password now sends actual emails
4. **Fallback System**: Works with or without Brevo templates

## 🔧 Environment Variables Setup

Add these variables to your `.env` file in the backend directory:

```env
# Brevo Email Service Configuration (Optional - system works without it)
BREVO_API_KEY=your-brevo-api-key-here
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_PASSWORD_RESET_TEMPLATE_ID=1
BREVO_WELCOME_TEMPLATE_ID=2

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

**Note**: The system works perfectly without Brevo configuration! If no `BREVO_API_KEY` is set, emails will be logged to the console for development testing.

## 📧 How to Get Brevo API Key

1. **Sign up at Brevo**: Go to [https://www.brevo.com](https://www.brevo.com)
2. **Create Account**: Sign up for a free account
3. **Get API Key**: 
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key and add it to your `.env` file

## 🎨 Email Templates (Optional)

### Option 1: Use Brevo Templates (Recommended)
1. **Create Template**: In Brevo dashboard, create a password reset template
2. **Template Variables**: Use these variables in your template:
   - `{{ params.NAME }}` - User's name
   - `{{ params.RESET_URL }}` - Password reset link
   - `{{ params.COMPANY_NAME }}` - Company name
   - `{{ params.SUPPORT_EMAIL }}` - Support email

3. **Get Template ID**: Copy the template ID and add to `.env`

### Option 2: Use Simple HTML Emails (Fallback)
If you don't set up templates, the system will automatically use beautiful HTML emails with:
- Professional styling
- Password reset button
- Security warnings
- Company branding

## 🚀 Testing the Setup

### Step 1: Set Environment Variables
```bash
# In your .env file
BREVO_API_KEY=xkeys-your-actual-api-key-here
FRONTEND_URL=http://localhost:3000
```

### Step 2: Start the Backend
```bash
cd backend
npm start
```

### Step 3: Test Forgot Password
1. Go to `http://localhost:3000/login`
2. Click "Forgot your password?"
3. Enter an email address
4. Check your email inbox!

## 📋 Email Features

### ✅ What Works Now
- **Real Email Sending**: Uses Brevo to send actual emails
- **Professional Templates**: Beautiful HTML emails with styling
- **Security**: 10-minute token expiration
- **Fallback System**: Works even without Brevo templates
- **Error Handling**: Graceful fallbacks if email fails
- **Development Mode**: Shows reset token in console for testing

### 📧 Email Content Includes
- User's name and personalized greeting
- Professional EWA Fashion branding
- Clear password reset button
- Security warnings and instructions
- Support contact information
- Mobile-responsive design

## 🔍 Troubleshooting

### If Emails Don't Send
1. **Check API Key**: Verify `BREVO_API_KEY` is correct
2. **Check Console**: Look for error messages in backend logs
3. **Test API Key**: Use Brevo's API testing tools
4. **Check Quota**: Ensure you haven't exceeded Brevo limits

### If Using Templates
1. **Template ID**: Make sure `BREVO_PASSWORD_RESET_TEMPLATE_ID` is correct
2. **Template Variables**: Ensure template uses correct variable names
3. **Template Status**: Verify template is active in Brevo dashboard

### Development Testing
- In development mode, the reset token is still shown in the response
- Check browser console for detailed error messages
- Use the fallback simple email if templates don't work

## 🎯 Next Steps

1. **Get Brevo API Key**: Sign up and get your API key
2. **Add to .env**: Set the environment variables
3. **Test**: Try the forgot password functionality
4. **Customize**: Create custom email templates in Brevo
5. **Deploy**: Make sure to set environment variables in production

## 📞 Support

If you need help:
1. Check the backend console for error messages
2. Verify your Brevo API key is working
3. Test with the simple email fallback first
4. Check Brevo's documentation for template setup

The email service is now fully functional and will send real emails when you configure your Brevo API key! 🎉
