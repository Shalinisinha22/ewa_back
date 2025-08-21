# Complete API Payloads Guide - EWA Fashion Platform

## 🎯 **Role Hierarchy**
- **🏆 Super Admin**: Platform-level administrator (no store) - creates admins with stores
- **🏪 Admin**: Store-level administrator - manages their assigned store

---

## 🏆 **1. Super Admin Creation (One-time Setup)**

### **Endpoint:**
```
POST /api/admin/super-admin
```

### **Payload:**
```json
{
  "name": "Super Admin Name",
  "email": "superadmin@ewafashion.com",
  "password": "SuperAdminPass123!"
}
```

### **Response:**
```json
{
  "message": "Super admin created successfully",
  "admin": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Super Admin Name",
    "email": "superadmin@ewafashion.com",
    "status": "active",
    "storeName": "EWA Fashion Platform",
    "storeId": null,
    "role": "super_admin",
    "permissions": [
      "products", "categories", "orders", "customers", 
      "coupons", "banners", "pages", "reports", "settings"
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🏪 **2. Admin Creation (Super Admin Only)**

### **Endpoint:**
```
POST /api/admin
```

### **Headers:**
```
Authorization: Bearer <super_admin_token>
Content-Type: application/json
```

### **Payload:**
```json
{
  "name": "Store Admin Name",
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!",
  "storeName": "Fashion Paradise Store",
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

### **Response:**
```json
{
  "message": "Admin created successfully with store access",
  "admin": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "name": "Store Admin Name",
    "email": "admin@fashionstore.com",
    "status": "active",
    "storeName": "Fashion Paradise Store",
    "storeId": "64f8a1b2c3d4e5f6a7b8c9d3",
    "role": "admin",
    "permissions": [
      "products", "categories", "orders", "customers", 
      "coupons", "banners", "pages", "reports", "settings"
    ]
  },
  "store": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "name": "Fashion Paradise Store",
    "slug": "fashion-paradise-store",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔐 **3. Admin Login**

### **Endpoint:**
```
POST /api/admin/login
```

### **Payload:**
```json
{
  "email": "admin@fashionstore.com",
  "password": "AdminPass123!"
}
```

### **Response:**
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
    "products", "categories", "orders", "customers", 
    "coupons", "banners", "pages", "reports", "settings"
  ],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📸 **4. Image Upload**

### **Endpoint:**
```
POST /api/upload/image
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Payload (Form Data):**
```
image: [file] (JPEG, PNG, GIF, WebP, etc.)
```

### **Response:**
```json
{
  "url": "/uploads/images/ewa-fashion-123/1234567890_abc123.jpg",
  "publicId": "ewa-fashion-123/1234567890_abc123.jpg",
  "originalName": "product-image.jpg",
  "size": 1024000,
  "mimetype": "image/jpeg"
}
```

---

## 🎬 **5. Video Upload**

### **Endpoint:**
```
POST /api/upload/video
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Payload (Form Data):**
```
video: [file] (MP4, AVI, MOV, WMV, etc.)
```

### **Response:**
```json
{
  "url": "/uploads/videos/ewa-fashion-123/1234567890_def456.mp4",
  "publicId": "ewa-fashion-123/1234567890_def456.mp4",
  "originalName": "product-video.mp4",
  "size": 52428800,
  "mimetype": "video/mp4"
}
```

---

## 📸 **6. Multiple Images Upload**

### **Endpoint:**
```
POST /api/upload/images
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Payload (Form Data):**
```
images: [file1, file2, file3, ...] (max 10 files)
```

### **Response:**
```json
[
  {
    "url": "/uploads/images/ewa-fashion-123/1234567890_img1.jpg",
    "publicId": "ewa-fashion-123/1234567890_img1.jpg",
    "originalName": "image1.jpg",
    "size": 512000,
    "mimetype": "image/jpeg"
  },
  {
    "url": "/uploads/images/ewa-fashion-123/1234567891_img2.png",
    "publicId": "ewa-fashion-123/1234567891_img2.png",
    "originalName": "image2.png",
    "size": 768000,
    "mimetype": "image/png"
  }
]
```

---

## 🎬 **7. Multiple Videos Upload**

### **Endpoint:**
```
POST /api/upload/videos
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

### **Payload (Form Data):**
```
videos: [file1, file2, file3, ...] (max 5 files)
```

### **Response:**
```json
[
  {
    "url": "/uploads/videos/ewa-fashion-123/1234567890_vid1.mp4",
    "publicId": "ewa-fashion-123/1234567890_vid1.mp4",
    "originalName": "video1.mp4",
    "size": 26214400,
    "mimetype": "video/mp4"
  },
  {
    "url": "/uploads/videos/ewa-fashion-123/1234567891_vid2.avi",
    "publicId": "ewa-fashion-123/1234567891_vid2.avi",
    "originalName": "video2.avi",
    "size": 31457280,
    "mimetype": "video/x-msvideo"
  }
]
```

---

## 🗑️ **8. Delete File**

### **Endpoint:**
```
DELETE /api/upload/file
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **Payload:**
```json
{
  "publicId": "ewa-fashion-123/1234567890_abc123.jpg",
  "type": "image"
}
```

### **Response:**
```json
{
  "message": "File deleted successfully"
}
```

---

## 📝 **9. Get Admin Profile**

### **Endpoint:**
```
GET /api/admin/profile
```

### **Headers:**
```
Authorization: Bearer <admin_token>
```

### **Response:**
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
    "products", "categories", "orders", "customers", 
    "coupons", "banners", "pages", "reports", "settings"
  ],
  "avatar": "/uploads/images/admin-avatar.jpg",
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## ✏️ **10. Update Admin Profile**

### **Endpoint:**
```
PUT /api/admin/profile
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **Payload:**
```json
{
  "name": "Updated Admin Name",
  "email": "updated@fashionstore.com",
  "avatar": "/uploads/images/new-avatar.jpg"
}
```

### **Response:**
```json
{
  "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "name": "Updated Admin Name",
  "email": "updated@fashionstore.com",
  "status": "active",
  "storeName": "Fashion Paradise Store",
  "storeId": "64f8a1b2c3d4e5f6a7b8c9d3",
  "role": "admin",
  "permissions": [
    "products", "categories", "orders", "customers", 
    "coupons", "banners", "pages", "reports", "settings"
  ],
  "avatar": "/uploads/images/new-avatar.jpg"
}
```

---

## 🔑 **11. Change Password**

### **Endpoint:**
```
PUT /api/admin/profile/password
```

### **Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

### **Payload:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### **Response:**
```json
{
  "message": "Password updated successfully"
}
```

---

## 📊 **12. Get All Admins (Super Admin Only)**

### **Endpoint:**
```
GET /api/admin?page=1&limit=10&search=admin&status=active&role=admin
```

### **Headers:**
```
Authorization: Bearer <super_admin_token>
```

### **Response:**
```json
{
  "admins": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Store Admin Name",
      "email": "admin@fashionstore.com",
      "status": "active",
      "storeName": "Fashion Paradise Store",
      "storeId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "role": "admin",
      "permissions": [
        "products", "categories", "orders", "customers", 
        "coupons", "banners", "pages", "reports", "settings"
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pages": 1,
  "total": 1
}
```

---

## 🧪 **Quick Test Payloads**

### **Super Admin Creation:**
```json
{
  "name": "Test Super Admin",
  "email": "test@ewafashion.com",
  "password": "TestSuperPass123!"
}
```

### **Admin Creation:**
```json
{
  "name": "Test Store Admin",
  "email": "testadmin@store.com",
  "password": "TestAdminPass123!",
  "storeName": "Test Fashion Store",
  "status": "active"
}
```

### **Admin Login:**
```json
{
  "email": "testadmin@store.com",
  "password": "TestAdminPass123!"
}
```

### **Profile Update:**
```json
{
  "name": "Updated Test Admin",
  "email": "updated@store.com"
}
```

### **Password Change:**
```json
{
  "currentPassword": "TestAdminPass123!",
  "newPassword": "NewTestPass456!"
}
```

---

## 🔄 **Complete Workflow**

### **Step 1: Create Super Admin**
```bash
POST /api/admin/super-admin
{
  "name": "Super Admin",
  "email": "super@ewafashion.com",
  "password": "SuperPass123!"
}
```

### **Step 2: Super Admin Login**
```bash
POST /api/admin/login
{
  "email": "super@ewafashion.com",
  "password": "SuperPass123!"
}
```

### **Step 3: Create Admin with Store**
```bash
POST /api/admin
Authorization: Bearer <super_admin_token>
{
  "name": "Store Admin",
  "email": "admin@store.com",
  "password": "AdminPass123!",
  "storeName": "Fashion Store",
  "status": "active"
}
```

### **Step 4: Admin Login**
```bash
POST /api/admin/login
{
  "email": "admin@store.com",
  "password": "AdminPass123!"
}
```

### **Step 5: Upload Files**
```bash
POST /api/upload/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
image: [file]
```

---

## 📱 **Postman Setup**

### **Environment Variables:**
```
baseUrl: http://localhost:5000
superAdminToken: {{super_admin_token}}
adminToken: {{admin_token}}
```

### **Pre-request Scripts:**
```javascript
// Set token after login
pm.environment.set("adminToken", pm.response.json().token);
```

All payloads are ready to use with the correct role hierarchy! 🚀 