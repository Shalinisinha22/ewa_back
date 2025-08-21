# 🔐 Admin Login API Documentation

## **Endpoint:**
```
POST /api/admin/login
```

## **Description:**
Authenticates an admin user and returns a JWT token for accessing protected routes.

---

## 📋 **Request Details**

### **Headers:**
```
Content-Type: application/json
```

### **Request Body (JSON):**
```json
{
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!"
}
```

### **Required Fields:**
- `email` (string): Admin's email address
- `password` (string): Admin's password (minimum 6 characters)

---

## 📤 **Request Examples**

### **1. Super Admin Login**
```json
{
  "email": "superadmin@ewafashion.com",
  "password": "SuperAdminPass123!"
}
```

### **2. Store Admin Login**
```json
{
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!"
}
```

### **3. Manager Login**
```json
{
  "email": "manager@fashionstore.com",
  "password": "ManagerPass123!"
}
```

---

## 📥 **Success Response (200 OK)**

### **Super Admin Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
  "name": "Super Admin Name",
  "email": "superadmin@ewafashion.com",
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
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjhhMWIyYzNkNGU1ZjZhN2I4YzlkMCIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM3MTU5ODkwfQ.example"
}
```

### **Store Admin Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "name": "Store Admin Name",
  "email": "admin@fashionstore.com",
  "status": "active",
  "storeName": "Fashion Paradise Store",
  "storeId": "64f8a1b2c3d4e5f6a7b8c9d3",
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
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjhhMWIyYzNkNGU1ZjZhN2I4YzlkMiIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM3MTU5ODkwfQ.example"
}
```

### **Manager Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
  "name": "Manager Name",
  "email": "manager@fashionstore.com",
  "status": "active",
  "storeName": "Fashion Paradise Store",
  "storeId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "role": "manager",
  "permissions": [
    "products",
    "categories",
    "orders",
    "customers"
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0ZjhhMWIyYzNkNGU1ZjZhN2I4YzlkNCIsImlhdCI6MTczNDU2Nzg5MCwiZXhwIjoxNzM3MTU5ODkwfQ.example"
}
```

---

## ❌ **Error Responses**

### **401 Unauthorized - Invalid Credentials**
```json
{
  "message": "Invalid credentials"
}
```

### **401 Unauthorized - Account Not Active**
```json
{
  "message": "Account is not active"
}
```

### **400 Bad Request - Missing Fields**
```json
{
  "message": "Email and password are required"
}
```

### **400 Bad Request - Invalid Email Format**
```json
{
  "message": "Please enter a valid email"
}
```

### **500 Internal Server Error**
```json
{
  "message": "Server error occurred"
}
```

---

## 🧪 **Test Cases**

### **Test Case 1: Valid Super Admin Login**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@ewafashion.com",
    "password": "SuperAdminPass123!"
  }'
```

### **Test Case 2: Valid Store Admin Login**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fashionstore.com",
    "password": "AdminPass123!"
  }'
```

### **Test Case 3: Wrong Password**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fashionstore.com",
    "password": "WrongPassword123!"
  }'
```

### **Test Case 4: Non-existent Email**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SomePassword123!"
  }'
```

### **Test Case 5: Missing Password**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fashionstore.com"
  }'
```

### **Test Case 6: Invalid Email Format**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "AdminPass123!"
  }'
```

---

## 💻 **Code Examples**

### **JavaScript/Fetch:**
```javascript
const loginAdmin = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Usage
loginAdmin('admin@fashionstore.com', 'AdminPass123!')
  .then(result => {
    console.log('Login successful:', result);
    // Store the token
    localStorage.setItem('adminToken', result.token);
    localStorage.setItem('adminData', JSON.stringify(result));
  })
  .catch(error => {
    console.error('Login failed:', error);
  });
```

### **Axios:**
```javascript
import axios from 'axios';

const loginAdmin = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:5000/api/admin/login', {
      email: email,
      password: password
    });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data?.message || error.message);
    throw error;
  }
};

// Usage
try {
  const result = await loginAdmin('admin@fashionstore.com', 'AdminPass123!');
  console.log('Login successful:', result);
  // Store token
  localStorage.setItem('adminToken', result.token);
} catch (error) {
  console.error('Login failed:', error);
}
```

### **React Hook:**
```javascript
import { useState } from 'react';

const useAdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message);
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

// Usage in component
const LoginForm = () => {
  const { login, loading, error } = useAdminLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await login(email, password);
      console.log('Login successful:', result);
      // Redirect or update state
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

---

## 📱 **Postman Collection**

### **Request Setup:**
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/admin/login`
- **Headers**: 
  - `Content-Type: application/json`

### **Body (raw JSON):**
```json
{
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!"
}
```

### **Pre-request Script:**
```javascript
// Optional: Set environment variables
pm.environment.set("baseUrl", "http://localhost:5000");
```

### **Tests Script:**
```javascript
// Save token to environment variable
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("adminToken", response.token);
  pm.environment.set("adminId", response._id);
  pm.environment.set("adminRole", response.role);
  
  console.log("Token saved:", response.token);
  console.log("Admin role:", response.role);
}
```

---

## 🔒 **Security Features**

### **Password Security:**
- Passwords are hashed using bcrypt with 12 salt rounds
- Minimum 6 characters required
- Secure password comparison

### **Token Security:**
- JWT tokens with 30-day expiration
- Includes admin ID and role information
- Automatically updates last login timestamp

### **Account Protection:**
- Only active accounts can login
- Suspended or inactive accounts are blocked
- Rate limiting can be implemented

---

## 🔄 **Complete Workflow**

### **Step 1: Login Request**
```bash
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!"
}
```

### **Step 2: Store Token**
```javascript
const response = await loginAdmin(email, password);
localStorage.setItem('adminToken', response.token);
```

### **Step 3: Use Token for Protected APIs**
```javascript
// Example: Get admin profile
const profile = await fetch('/api/admin/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
});
```

---

## 📊 **Response Field Details**

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Unique admin ID |
| `name` | String | Admin's full name |
| `email` | String | Admin's email address |
| `status` | String | Account status (active/inactive) |
| `storeName` | String | Store name (null for super admin) |
| `storeId` | String | Store ID (null for super admin) |
| `role` | String | Admin role (super_admin/admin/manager) |
| `permissions` | Array | List of granted permissions |
| `token` | String | JWT token for authentication |

---

## 🚀 **Quick Start**

1. **Create a super admin first:**
```bash
POST /api/admin/super-admin
{
  "name": "Super Admin",
  "email": "superadmin@ewafashion.com",
  "password": "SuperAdminPass123!"
}
```

2. **Login with the super admin:**
```bash
POST /api/admin/login
{
  "email": "superadmin@ewafashion.com",
  "password": "SuperAdminPass123!"
}
```

3. **Use the returned token for other APIs:**
```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

The Admin Login API is ready to use! 🎯 