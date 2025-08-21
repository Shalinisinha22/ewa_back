# Admin Creation API Documentation

## Overview
This API allows the **Super Admin** to create new **Admin** users with their own stores. The role hierarchy is:
- **Super Admin**: Platform-level administrator (no store) - creates admins with stores
- **Admin**: Store-level administrator - responsible for all operations within their assigned store

## 🔐 Authentication Required
- **Super Admin Only**: Can create admins with stores
- **Admins**: Cannot create other admins (they manage their store operations)

## API Endpoint

### Create Admin
```
POST /api/admin
```

### Headers Required
```
Authorization: Bearer <super_admin_jwt_token>
Content-Type: application/json
```

## Request Body

### Required Payload
```json
{
  "name": "Admin Name",
  "email": "admin@store.com",
  "password": "securePassword123",
  "storeName": "Fashion Store Name",
  "permissions": ["products", "categories", "orders", "customers", "coupons", "banners", "pages", "reports", "settings"],
  "status": "active"
}
```

## Request Parameters

### Required Fields
- `name` (string): Full name of the admin
- `email` (string): Email address (must be unique)
- `password` (string): Password (minimum 6 characters)
- `storeName` (string): Name for the store (will create new store if doesn't exist)

### Optional Fields
- `permissions` (array): Array of permissions (default: all permissions)
- `status` (string): Account status - `active`, `inactive`, `suspended` (default: `active`)

## Role Hierarchy

### Super Admin
- 🏆 **Platform Level Access**
- No store assignment (platform-level only)
- Can create admins with stores
- Can manage all stores and admins
- Can view system-wide reports
- Cannot perform store-specific operations

### Admin
- 🏪 **Store Level Access**
- Responsible for all operations within their store
- Full permissions for their assigned store
- Can manage products, categories, orders, customers, etc.
- Cannot create other admins
- Cannot access other stores

## Available Permissions (Default: All)

```javascript
[
  "products",      // Manage products
  "categories",    // Manage categories
  "orders",        // Manage orders
  "customers",     // Manage customers
  "coupons",       // Manage coupons
  "banners",       // Manage banners
  "pages",         // Manage pages
  "reports",       // Access reports
  "settings"       // Manage settings
]
```

## Example Requests

### Create Admin with Store
```bash
curl -X POST http://localhost:5000/api/admin \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "sarah@fashionstore.com",
    "password": "StorePass123!",
    "storeName": "Fashion Paradise",
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
    ],
    "status": "active"
  }'
```

## Success Response (201 Created)

```json
{
  "message": "Admin created successfully with store access",
  "admin": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Sarah Johnson",
    "email": "sarah@fashionstore.com",
    "status": "active",
    "storeName": "Fashion Paradise",
    "storeId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "role": "admin",
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
  "store": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Fashion Paradise",
    "slug": "fashion-paradise",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Error Responses

### 403 Forbidden - Not Super Admin
```json
{
  "message": "Access denied. Only super admin can create admins."
}
```

### 400 Bad Request - Store Name Required
```json
{
  "message": "Store name is required when creating an admin"
}
```

### 400 Bad Request - Email Already Exists
```json
{
  "message": "Admin with this email already exists"
}
```

### 401 Unauthorized - No Token
```json
{
  "message": "Not authorized, no token"
}
```

## Store Creation

When creating an admin, a new store is automatically created with:
- **Name**: Provided store name
- **Slug**: Auto-generated from store name
- **Description**: "{StoreName} - Fashion Store"
- **Status**: "active"
- **Currency**: "INR"
- **Timezone**: "Asia/Kolkata"
- **Language**: "en"

## Admin Responsibilities

### What Admins Can Do:
- ✅ **Products**: Add, edit, delete products
- ✅ **Categories**: Manage product categories
- ✅ **Orders**: Process and manage orders
- ✅ **Customers**: Manage customer accounts
- ✅ **Coupons**: Create and manage discounts
- ✅ **Banners**: Manage promotional banners
- ✅ **Pages**: Create and edit pages
- ✅ **Reports**: View store analytics
- ✅ **Settings**: Configure store settings

### What Admins Cannot Do:
- ❌ Create other admins
- ❌ Access other stores
- ❌ Modify platform settings
- ❌ View system-wide reports

## Usage Workflow

### 1. Super Admin Setup
```bash
# Create super admin (first time only)
POST /api/admin/super-admin
```

### 2. Super Admin Login
```bash
# Login as super admin
POST /api/admin/login
```

### 3. Create Admin with Store
```bash
# Create admin with store
POST /api/admin
Authorization: Bearer <super_admin_token>
```

### 4. Admin Login
```bash
# Admin logs into their store
POST /api/admin/login
```

## Security Features

### Access Control
- Only super admin can create admins
- Admins are isolated to their stores
- Role-based permission system

### Password Security
- Minimum 6 characters required
- Automatically hashed using bcrypt
- Salt rounds: 12

### Email Validation
- Must be unique across the system
- Email format validation
- Case-insensitive matching

## Testing Examples

### Test Case 1: Create Admin with New Store
```json
{
  "name": "Test Admin",
  "email": "testadmin@example.com",
  "password": "TestPass123!",
  "storeName": "Test Fashion Store",
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
  ],
  "status": "active"
}
```

### Test Case 2: Create Admin with Existing Store
```json
{
  "name": "Second Admin",
  "email": "second@example.com",
  "password": "SecondPass123!",
  "storeName": "Test Fashion Store", // Will use existing store
  "status": "active"
}
```

## JavaScript/Fetch Example

```javascript
const createAdmin = async (adminData, superAdminToken) => {
  try {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(adminData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

// Usage
const adminData = {
  name: "John Doe",
  email: "john@store.com",
  password: "SecurePass123!",
  storeName: "John's Fashion Store",
  permissions: [
    "products",
    "categories",
    "orders",
    "customers",
    "coupons",
    "banners",
    "pages",
    "reports",
    "settings"
  ],
  status: "active"
};

const superAdminToken = "your_super_admin_token";

createAdmin(adminData, superAdminToken)
  .then(result => {
    console.log('Admin created:', result);
  })
  .catch(error => {
    console.error('Failed to create admin:', error);
  });
```

## Best Practices

### 1. Store Naming
- Use descriptive store names
- Avoid special characters in store names
- Consider brand consistency

### 2. Admin Management
- Create admins only when needed
- Use business email addresses
- Document admin responsibilities

### 3. Security
- Use strong passwords
- Regularly review admin access
- Monitor admin activities

### 4. Store Organization
- Plan store structure before creation
- Consider store-specific settings
- Document store configurations

## Troubleshooting

### Common Issues

1. **"Access denied. Only super admin can create admins"**
   - Ensure you're logged in as super admin
   - Check your role in the token
   - Verify token expiration

2. **"Store name is required when creating an admin"**
   - Provide a store name in the request
   - Store name cannot be empty

3. **"Admin with this email already exists"**
   - Use a different email address
   - Check existing admin list

4. **Store creation fails**
   - Check store name format
   - Ensure store name is unique
   - Verify database connection 