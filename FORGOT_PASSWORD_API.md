# Forgot Password API Documentation

## Overview
The forgot password functionality allows admin users to reset their passwords through a secure token-based system.

## API Endpoints

### 1. Forgot Password
**POST** `/api/admin/forgot-password`

Sends a password reset token to the admin's email address.

#### Request Body
```json
{
  "email": "admin@example.com"
}
```

#### Response
```json
{
  "message": "If an account with that email exists, a password reset link has been sent.",
  "resetToken": "abc123..." // Only in development mode
}
```

#### Security Notes
- The API doesn't reveal whether an email exists or not
- Reset tokens expire in 10 minutes
- Tokens are hashed before storing in the database

### 2. Reset Password
**POST** `/api/admin/reset-password`

Resets the admin's password using a valid reset token.

#### Request Body
```json
{
  "token": "abc123...",
  "newPassword": "newpassword123"
}
```

#### Response
```json
{
  "message": "Password has been reset successfully"
}
```

#### Validation
- Token must be valid and not expired
- New password must be at least 6 characters long
- Token is automatically cleared after successful reset

## Frontend Integration

### 1. Forgot Password Modal
- Accessible from the login page
- Collects email address
- Shows success/error messages
- In development mode, displays the reset token

### 2. Reset Password Page
- Accessible via `/reset-password?token=<token>`
- Validates token on page load
- Collects new password and confirmation
- Redirects to login after successful reset

## Database Schema Updates

The Admin model now includes:
```javascript
resetPasswordToken: String,
resetPasswordExpires: Date
```

## Security Features

1. **Token Hashing**: Reset tokens are hashed using SHA-256 before storage
2. **Expiration**: Tokens expire after 10 minutes
3. **One-time Use**: Tokens are cleared after successful password reset
4. **Email Privacy**: API doesn't reveal if email exists in the system

## Development vs Production

### Development Mode
- Reset tokens are returned in API responses for testing
- Email content is logged to console
- No actual emails are sent

### Production Mode
- Reset tokens are not returned in API responses
- Actual email service should be implemented
- Use the `emailService.js` utility as a starting point

## Email Service Implementation

To implement actual email sending:

1. Install nodemailer: `npm install nodemailer`
2. Configure email service in `utils/emailService.js`
3. Uncomment the email service import in `adminController.js`
4. Set up environment variables for email credentials

Example environment variables:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=https://your-frontend-domain.com
```

## Testing

### Manual Testing
1. Go to login page
2. Click "Forgot your password?"
3. Enter a valid admin email
4. Copy the reset token from the response (development only)
5. Navigate to `/reset-password?token=<token>`
6. Enter new password and confirm
7. Verify you can login with the new password

### API Testing with cURL

#### Forgot Password
```bash
curl -X POST http://localhost:5000/api/admin/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

#### Reset Password
```bash
curl -X POST http://localhost:5000/api/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "your-reset-token", "newPassword": "newpassword123"}'
```

## Error Handling

Common error scenarios:
- Invalid or expired token
- Password too short
- Email not found (returns generic message for security)
- Server errors

All errors return appropriate HTTP status codes and error messages.
