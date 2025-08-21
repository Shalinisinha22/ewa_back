# Super Admin API Documentation

## Overview
This API allows you to create the initial super admin for the EWA Fashion platform. Super admin is a platform-level administrator who manages the entire system and creates admins with stores.

## ⚠️ Important Notes
- **One-time use only**: This endpoint can only be used if no super admin exists in the system
- **Public access**: No authentication required (by design for initial setup)
- **No store assigned**: Super admin doesn't have a store - they manage the platform
- **Security**: After creating the super admin, this endpoint becomes inactive

## API Endpoint

### Create Super Admin
```
POST /api/admin/super-admin
```

### Request Body
```json
{
  "name": "Super Admin Name",
  "email": "superadmin@example.com",
  "password": "securePassword123"
}
```

### Required Fields
- `name` (string): Full name of the super admin
- `email` (string): Email address (must be unique)
- `password` (string): Password (minimum 6 characters)

### Example Request
```bash
curl -X POST http://localhost:5000/api/admin/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@ewafashion.com",
    "password": "SecurePass123!"
  }'
```

### Success Response (201 Created)
```json
{
  "message": "Super admin created successfully",
  "admin": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john@ewafashion.com",
    "status": "active",
    "storeName": "EWA Fashion Platform",
    "storeId": null,
    "role": "super_admin",
    "permissions": [
      "products",
      "categories", 
      "orders",
      "customers",
      "coupons",
      "banners",
      "pages",
      "reports",
      "settings"
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

#### 400 Bad Request - Super Admin Already Exists
```json
{
  "message": "Super admin already exists. This endpoint is only for initial setup."
}
```

#### 400 Bad Request - Email Already Exists
```json
{
  "message": "Admin with this email already exists"
}
```

#### 400 Bad Request - Validation Error
```json
{
  "message": "Validation error details"
}
```

## Super Admin Role

### Platform-Level Access
- 🏆 **No Store Assignment**: Super admin doesn't have a specific store
- 🏆 **Platform Management**: Manages the entire EWA Fashion platform
- 🏆 **Admin Creation**: Creates admins with their own stores
- 🏆 **System Access**: Can access all stores and system-wide data

### Super Admin Permissions
The super admin automatically gets all permissions:
- ✅ **Products** - Manage all products across stores
- ✅ **Categories** - Manage all categories across stores  
- ✅ **Orders** - View and manage all orders
- ✅ **Customers** - Manage all customers
- ✅ **Coupons** - Create and manage coupons
- ✅ **Banners** - Manage banners and promotions
- ✅ **Pages** - Manage static pages
- ✅ **Reports** - Access all reports and analytics
- ✅ **Settings** - Configure platform settings

## Key Differences

### Super Admin vs Admin
| Feature | Super Admin | Admin |
|---------|-------------|-------|
| **Store Assignment** | No store (platform level) | Has specific store |
| **Scope** | Platform-wide | Store-specific |
| **Admin Creation** | Can create admins | Cannot create admins |
| **Store Access** | All stores | Only their store |
| **Purpose** | Platform management | Store management |

## Security Features

### Password Requirements
- Minimum 6 characters
- Automatically hashed using bcrypt
- Salt rounds: 12

### Email Verification
- Super admin is automatically marked as email verified
- Can immediately access all features

### Token Generation
- JWT token is automatically generated
- Can be used for subsequent API calls
- Token includes admin ID and role information

## Usage Workflow

### 1. Initial Setup
```bash
# Create super admin (first time only)
POST /api/admin/super-admin
```

### 2. Login with Super Admin
```bash
# Login with created credentials
POST /api/admin/login
```

### 3. Create Admins with Stores
```bash
# Use super admin token to create admins with stores
POST /api/admin
Authorization: Bearer <super_admin_token>
```

## Testing the API

### Using Postman
1. Set method to `POST`
2. URL: `http://localhost:5000/api/admin/super-admin`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "name": "Test Super Admin",
  "email": "test@ewafashion.com", 
  "password": "TestPass123!"
}
```

### Using cURL
```bash
curl -X POST http://localhost:5000/api/admin/super-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Super Admin",
    "email": "test@ewafashion.com",
    "password": "TestPass123!"
  }'
```

## Next Steps

After creating the super admin:

1. **Login** using the credentials
2. **Create admins** with their own stores
3. **Configure platform settings**
4. **Monitor system-wide operations**

## Troubleshooting

### Common Issues

1. **"Super admin already exists"**
   - This endpoint can only be used once
   - Use regular admin login instead

2. **"Email already exists"**
   - Choose a different email address
   - Check if admin was already created

3. **Validation errors**
   - Ensure all required fields are provided
   - Check email format
   - Ensure password is at least 6 characters

### Database Reset
If you need to reset and create a new super admin:
```bash
# Clear admin collection (be careful!)
db.admins.deleteMany({})
``` 