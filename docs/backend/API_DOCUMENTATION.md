# 🍳 Savora API Documentation

## 📋 Base URL

```
Development: http://localhost:5000
Production: https://api.Savora.com (TBD)
```

---

## 🎯 Quick Summary

| Icon | Meaning | Description |
|-------|-------------|-------------|
| 🌐 | **Public** | No authentication required. Anyone can access. |
| 🔒 | **Chef** | Requires JWT token. Only authenticated users with `chef` role. |
| 👑 | **Admin** | Requires JWT token + `admin` role. Full system access. |
| ⚡ | **Cached** | Endpoint uses caching for improved performance. |

**Total Endpoints:** 61 (10 public + 40 chef + 11 admin)
**Cached Endpoints:** 9 (marked with ⚡)

---

## 📏 API Conventions

### Endpoint Naming (REST Standard)

**Collections (Plural nouns):**
- `GET /resources` - List all resources (with optional filters/pagination)
- `POST /resources` - Create new resource

**Single Items:**
- `GET /resources/:id` - Get single resource by ID
- `PUT /resources/:id` - Update entire resource (full replacement)
- `DELETE /resources/:id` - Delete resource

**Actions/Partial Updates:**
- `PATCH /resources/:id/action` - Perform specific action or partial update
- Examples: `PATCH /quotations/:id/status`, `PATCH /admin/chefs/:id/status`

**Nested Resources:**
- `PUT /menus/:id/dishes` - Update dishes within a menu
- Parent-child relationship explicit in URL

**Public vs Protected:**
- `/public/*` - Public browsing (no auth, cached)
- `/*` - Protected resources (JWT required)
- `/admin/*` - Administrative operations (admin role required)

### Response Format

**Success Responses:**
```json
{
  "data": {"...": "..."} | [{"...": "..."}],
  "message": "Operation completed successfully" // optional
}
```

**Error Responses:**
```json
{
  "status": "error",
  "error": "Error description",
  "message": "Error description",
  "status_code": 400,
  "details": {"field": ["validation message"]} // optional
}
```

**Pagination (for list endpoints):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "pages": 5
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Reserved (not currently used; duplicates return 400) |
| 500 | Server Error | Unexpected server error |

---

## 🔐 Authentication

### Endpoint Types

**🌐 Public (No authentication):**
- Don't require JWT token
- Anyone can access
- Examples: `/public/chefs`, `/auth/register`, `/auth/login`

**🔒 Protected (Requires Chef authentication):**
- Require valid JWT token in Authorization header
- Only authenticated users with `chef` role
- Each chef can only manage their own resources (chefs cannot view/modify other chefs' data)

**👑 Admin (Requires Administrator authentication):**
- Require valid JWT token in Authorization header
- Only users with `admin` role
- Full access: can view and manage resources from all chefs
- Includes supervision, statistics, and moderation endpoints

**⚡ Cached (Performance optimized):**
- Endpoint implements caching for faster responses
- First request fetches from database, subsequent requests serve from cache
- Cache automatically invalidates on data updates

### How to get the token

1. Register: `POST /auth/register` (default role: `chef`)
2. Login: `POST /auth/login` (you'll receive the `token`)
3. Include the token in all protected endpoints:

```http
Authorization: Bearer <your_jwt_token>
```

**Token expiration:** 24 hours

### Important notes

- Protected endpoints (🔒) operate on the authenticated chef's data
- Admin endpoints (👑) have full access to all system resources
- A chef **CANNOT** access/modify another chef's data
- Admins **CAN** view and manage data from all chefs
- To create content (dishes/menus), an admin must have a separate chef profile
- Cached endpoints (⚡) provide faster responses after the first request

---

## 📊 Testing Status

| Module | Endpoints | Unit Tests | Integration Tests | Status | Last Update |
|--------|-----------|------------|-------------------|--------|-------------|
| Auth | 4 | 18 | 16 | ✅ **VALIDATED** | 2026-01-03 |
| Chef | 3 | 3 | 8 | ✅ **VALIDATED** | 2025-12-31 |
| Client | 5 | 8 | 12 | ✅ **VALIDATED** | 2025-12-31 |
| Dish | 7 | 14 | 16 | ✅ **VALIDATED** | 2025-12-31 |
| Menu | 6 | 9 | 18 | ✅ **VALIDATED** | 2025-12-31 |
| Quotation | 6 | 9 | 20 | ✅ **VALIDATED** | 2026-01-03 |
| Appointment | 6 | 12 | 19 | ✅ **VALIDATED** | 2026-01-03 |
| Scraper | 3 | 12 | 11 | ⏳ **DEFERRED (Post‑MVP)** | 2026-02-08 |
| Public | 10 | 15 | 10 | ✅ **VALIDATED** | 2025-12-31 |
| Admin | 11 | 16 | 20 | ✅ **VALIDATED** | 2025-12-31 |
| Cross-cutting coverage/hotspots | - | 77 | - | ✅ **VALIDATED** | 2026-01-03 |

**Total:** 58 active endpoints | **497 tests** (358 unit + 139 integration) | **85% unit-test coverage** | **9/10 modules validated** (Scraper deferred)

> Note: the per-module test counts above can drift as coverage and cross-cutting tests evolve. Use `pytest --collect-only` for the current exact counts.

---

## 📍 Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| **AUTH MODULE** ||||
| `POST` | `/auth/register` | 🌐 Public | Create new chef account |
| `POST` | `/auth/login` | 🌐 Public | Login and get token |
| `GET` | `/auth/me` | 🔒 Chef ⚡ | View my user information (cached via auth middleware) |
| **CHEF MODULE** ||||
| `POST` | `/chefs/profile` | 🔒 Chef | Create my chef profile (own) |
| `GET` | `/chefs/profile` | 🔒 Chef ⚡ | View my chef profile (service-level cache) |
| `PUT` | `/chefs/profile` | 🔒 Chef | Update my chef profile |
| **CLIENT MODULE** ||||
| `POST` | `/clients` | 🔒 Chef | Create client (assigned to me) |
| `GET` | `/clients` | 🔒 Chef | List my clients |
| `GET` | `/clients/:id` | 🔒 Chef | View one of my clients |
| `PUT` | `/clients/:id` | 🔒 Chef | Update one of my clients |
| `DELETE` | `/clients/:id` | 🔒 Chef | Delete one of my clients |
| **DISH MODULE** ||||
| `POST` | `/dishes` | 🔒 Chef | Create dish (assigned to me) |
| `GET` | `/dishes` | 🔒 Chef ⚡ | List my dishes (cached) |
| `GET` | `/dishes/:id` | 🔒 Chef ⚡ | View one of my dishes (cached) |
| `PUT` | `/dishes/:id` | 🔒 Chef | Update one of my dishes |
| `DELETE` | `/dishes/:id` | 🔒 Chef | Delete one of my dishes |
| **MENU MODULE** ||||
| `POST` | `/menus` | 🔒 Chef | Create menu (assigned to me) |
| `GET` | `/menus` | 🔒 Chef ⚡ | List my menus (cached) |
| `GET` | `/menus/:id` | 🔒 Chef ⚡ | View one of my menus (cached) |
| `PUT` | `/menus/:id` | 🔒 Chef | Update one of my menus |
| `PUT` | `/menus/:id/dishes` | 🔒 Chef | Assign dishes to my menu |
| `DELETE` | `/menus/:id` | 🔒 Chef | Delete one of my menus |
| **QUOTATION MODULE** ||||
| `POST` | `/quotations` | 🔒 Chef | Create quotation (assigned to me) |
| `GET` | `/quotations` | 🔒 Chef | List my quotations |
| `GET` | `/quotations/:id` | 🔒 Chef | View one of my quotations |
| `PUT` | `/quotations/:id` | 🔒 Chef | Update one of my quotations |
| `PATCH` | `/quotations/:id/status` | 🔒 Chef | Change my quotation status |
| `DELETE` | `/quotations/:id` | 🔒 Chef | Delete one of my quotations |
| **APPOINTMENT MODULE** ||||
| `POST` | `/appointments` | 🔒 Chef | Create appointment (assigned to me) |
| `GET` | `/appointments` | 🔒 Chef | List my appointments |
| `GET` | `/appointments/:id` | 🔒 Chef | View one of my appointments |
| `PUT` | `/appointments/:id` | 🔒 Chef | Update one of my appointments |
| `PATCH` | `/appointments/:id/status` | 🔒 Chef | Change my appointment status |
| `DELETE` | `/appointments/:id` | 🔒 Chef | Delete one of my appointments |
| **SCRAPER MODULE (DEFERRED / Post‑MVP)** ||||
| _Deferred_ | _Scraper endpoints_ | _N/A_ | Not available in current release |
| **PUBLIC MODULE** ||||
| `GET` | `/public/chefs` | 🌐 Public ⚡ | List all active chefs with filters (cached, 5min) |
| `GET` | `/public/chefs/:id` | 🌐 Public ⚡ | View complete chef profile (cached, 10min) |
| `GET` | `/public/chefs/:id/menus` | 🌐 Public ⚡ | List published menus for a chef (cached, 5min) |
| `GET` | `/public/search` | 🌐 Public | General chef search |
| `GET` | `/public/filters` | 🌐 Public | Get available filters |
| `GET` | `/public/menus/:id` | 🌐 Public | View public menu |
| `GET` | `/public/dishes/:id` | 🌐 Public | View public dish |
| **ADMIN MODULE** ||||
| `GET` | `/admin/dashboard` | 👑 Admin | Dashboard with global statistics |
| `GET` | `/admin/chefs` | 👑 Admin | List ALL system chefs |
| `GET` | `/admin/chefs/:id` | 👑 Admin | View complete profile of any chef |
| `PATCH` | `/admin/chefs/:id/status` | 👑 Admin | Activate/deactivate chef |
| `GET` | `/admin/users` | 👑 Admin | List all users |
| `DELETE` | `/admin/users/:id` | 👑 Admin | Delete user (soft delete) |
| `GET` | `/admin/reports` | 👑 Admin | System reports and analysis |
| `GET` | `/admin/audit-logs` | 👑 Admin | Administrative action logs |
| `GET` | `/admin/audit-logs/statistics` | 👑 Admin | Audit logs statistics |
| `GET` | `/admin/cache/stats` | 👑 Admin | Redis cache statistics |
| `DELETE` | `/admin/cache/clear` | 👑 Admin | Clear Redis cache by pattern |

---

## 📍 API Endpoints Details

### 🔐 **Auth Module** (✅ VALIDATED)

> **Authentication:** 2 public endpoints (🌐) + 1 protected (🔒)

#### **1. Register User** 🌐 Public
```http
POST /auth/register
```

**Important (Security):** This endpoint **cannot** create admin users. The `role` field is accepted for compatibility but is **ignored**; all public registrations create `chef` users.

To create the first admin user, use the seed script: `backend/scripts/seed_admin.py` (reads `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD` from `config/.env` or `config/.env.docker`).

**Request Body:**
```json
{
  "username": "chef_john",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "chef"  // Optional (ignored): always created as "chef"
}
```

**Validation Rules:**
- `username`: 3-50 characters, alphanumeric + underscores only
- `email`: Valid email format, max 120 characters
- `password`: Minimum 8 characters
- `role`: Accepted but ignored (always creates a `chef` user)

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 1,
    "username": "chef_john",
    "email": "john@example.com",
    "role": "chef",
    "is_active": true,
    "created_at": "2025-11-26T10:30:00",
    "updated_at": "2025-11-26T10:30:00"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

400 Bad Request - Validation errors:
```json
{
  "error": "Validation failed",
  "status_code": 400,
  "details": {
    "username": ["Username must be between 3 and 50 characters"],
    "password": ["Password must be between 8 and 128 characters"]
  }
}
```

400 Bad Request - Duplicate user:
```json
{
  "error": "Username 'chef_john' is already taken",
  "status_code": 400
}
```



---

#### **2. Login** 🌐 Public
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "chef_john",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 1,
      "username": "chef_john",
      "email": "john@example.com",
      "role": "chef",
      "is_active": true,
      "created_at": "2025-11-26T10:30:00",
      "updated_at": "2025-11-26T10:30:00"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer"
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password",
  "status_code": 401
}
```



---

#### **3. Get Current User** 🔒 Chef
```http
GET /auth/me
```

**Headers:**
```http
Authorization: Bearer <your_jwt_token>
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "username": "chef_john",
    "email": "john@example.com",
    "role": "chef",
    "is_active": true,
    "created_at": "2025-11-26T10:30:00",
    "updated_at": "2025-11-26T10:30:00"
  }
}
```

**Error Responses:**

401 Unauthorized - Missing token:
```json
{
  "error": "Missing authorization header",
  "status_code": 401
}
```

401 Unauthorized - Invalid token:
```json
{
  "error": "Invalid or expired token",
  "status_code": 401
}
```

---

### 👨‍🍳 **Chef Module** (✅ VALIDATED)

> **Module Structure:** 3 endpoints total (all protected 🔒)
> - Manage own chef profile (requires authentication)
> - Each chef can only manage their own profile
> 
> **Cache:** 1 endpoint uses caching (⚡)
> 
> **Important note:** For public listing and viewing of chef profiles, use the `/public/chefs` endpoints instead. This module focuses exclusively on authenticated profile management.

#### **1. Create Chef Profile** 🔒 Chef
```http
POST /chefs/profile
Authorization: Bearer {token}

Body:
{
  "bio": "Passionate chef with 10 years of experience in Italian cuisine",
  "specialty": "Italian Cuisine",
  "phone": "+1-555-0100",
  "location": "Miami, FL"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bio": "Passionate chef with 10 years...",
    "specialty": "Italian Cuisine",
    "phone": "+1-555-0100",
    "location": "Miami, FL",
    "is_active": true,
    "created_at": "2025-12-13T10:00:00Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  },
  "message": "Chef profile created successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Chef profile already exists for this user"
}
```

---

#### **2. Get My Profile** 🔒 Chef ⚡
```http
GET /chefs/profile
Authorization: Bearer {token}
```

**Cache:** This endpoint uses caching for improved performance. First request fetches from database, subsequent requests serve from Redis cache.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bio": "Passionate chef...",
    "specialty": "Italian Cuisine",
    "phone": "+1-555-0100",
    "location": "Miami, FL",
    "is_active": true,
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Chef profile not found"
}
```

---

#### **3. Update My Profile** 🔒 Chef
```http
PUT /chefs/profile
Authorization: Bearer {token}

Body:
{
  "bio": "Updated bio text",
  "specialty": "French Cuisine",
  "phone": "+1-555-0199",
  "location": "Los Angeles, CA"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "bio": "Updated bio text",
    "specialty": "French Cuisine",
    "phone": "+1-555-0199",
    "location": "Los Angeles, CA",
    "is_active": true,
    "updated_at": "2025-12-13T11:00:00Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  },
  "message": "Chef profile updated successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Chef profile not found"
}
```

---

### 🧑‍💼 **Client Module** (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** All endpoints require Chef authentication (🔒)
> 
> **Note:** You can only manage your own clients. Each client is automatically assigned to the authenticated chef.

#### **1. Create Client** 🔒 Chef
```http
POST /clients
Authorization: Bearer {token}

Body:
{
  "name": "John Client",
  "email": "client@example.com",
  "phone": "+1-555-0200",
  "company": "ABC Corp",
  "notes": "Prefers vegetarian options"
}
```

**Required fields:** `name`, `email`, `phone`

**Optional fields:** `company`, `notes`

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "John Client",
    "email": "client@example.com",
    "phone": "+1-555-0200",
    "company": "ABC Corp",
    "notes": "Prefers vegetarian options",
    "created_at": "2025-12-13T10:00:00Z"
  },
  "message": "Client created successfully"
}
```

**Error Response (400 - validation):**
```json
{
  "status": "error",
  "error": "Validation failed",
  "message": "Validation failed",
  "status_code": 400,
  "details": {
    "email": ["Not a valid email address."],
    "phone": ["Missing data for required field."]
  }
}
```

**Error Response (400 - duplicate email):**
```json
{
  "status": "error",
  "error": "A client with email 'client@example.com' already exists.",
  "message": "A client with email 'client@example.com' already exists.",
  "status_code": 400
}
```

---

#### **2. List Clients** 🔒 Chef
```http
GET /clients
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "chef_id": 1,
      "name": "John Client",
      "email": "client@example.com",
      "phone": "+1-555-0200",
      "company": "ABC Corp",
      "notes": "Prefers vegetarian options",
      "created_at": "2025-12-13T10:00:00Z"
    }
  ],
  "message": "Retrieved 2 clients"
}
```

---

#### **3. Get Client by ID** 🔒 Chef
```http
GET /clients/{id}
Authorization: Bearer {token}
```

**URL Parameters:**
- `id` (integer, required): Client ID

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "John Client",
    "email": "client@example.com",
    "phone": "+1-555-0200",
    "company": "ABC Corp",
    "notes": "Prefers vegetarian options",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Client not found or access denied",
  "message": "Client not found or access denied",
  "status_code": 404
}
```

---

#### **4. Update Client** 🔒
```http
PUT /clients/{id}
Authorization: Bearer {token}

Body:
{
  "name": "Updated Client Name",
  "phone": "+1-555-0299",
  "notes": "Updated preferences"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Note:** `null` values are ignored (only non-null fields are applied).

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Updated Client Name",
    "email": "client@example.com",
    "phone": "+1-555-0299",
    "company": "ABC Corp",
    "notes": "Updated preferences",
    "updated_at": "2025-12-13T11:00:00Z"
  },
  "message": "Client updated successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Client not found or access denied",
  "message": "Client not found or access denied",
  "status_code": 404
}
```

---

#### **5. Delete Client** 🔒
```http
DELETE /clients/{id}
Authorization: Bearer {token}
```

**URL Parameters:**
- `id` (integer, required): Client ID

**Success Response (200):**
```json
{
  "data": {},
  "message": "Client deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Client not found or access denied",
  "message": "Client not found or access denied",
  "status_code": 404
}
```

---

### 🍽️ **Dish Module** (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** All endpoints require Chef authentication (🔒)
> **Cache:** 2 endpoints use caching (⚡)
> 
> **Note:** You can only manage your own dishes. Each dish is automatically assigned to the authenticated chef.

#### **1. Create Dish with Ingredients** 🔒 Chef
```http
POST /dishes
Authorization: Bearer {token}

Body:
{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta dish",
  "price": 18.99,
  "category": "Main Course",
  "preparation_steps": "1. Boil pasta...",
  "prep_time": 30,
  "servings": 4,
  "photo_url": "https://res.cloudinary.com/...",
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "g",
      "is_optional": false
    }
  ]
}
```

**Required fields:** `name`, `description`, `price`, `category`, `prep_time`, `servings`

**Optional fields:** `preparation_steps`, `photo_url`, `ingredients`

**Data types notes:**
- `price` is serialized as a string with 2 decimals (e.g. `"18.99"`).
- Ingredient `quantity` is serialized as a string with 2 decimals when present.

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Pasta Carbonara",
    "price": "18.99",
    "ingredients": [
      {
        "id": 1,
        "name": "Spaghetti",
        "quantity": "400.00",
        "unit": "g",
        "is_optional": false
      }
    ]
  },
  "message": "Dish created successfully"
}
```

**Error Response (400 - duplicate dish name):**
```json
{
  "status": "error",
  "error": "You already have a dish named 'Pasta Carbonara'. Please use a different name.",
  "message": "You already have a dish named 'Pasta Carbonara'. Please use a different name.",
  "status_code": 400
}
```

**Error Response (400 - validation):**
```json
{
  "status": "error",
  "error": "Validation failed",
  "message": "Validation failed",
  "status_code": 400,
  "details": {
    "price": ["Missing data for required field."],
    "prep_time": ["Missing data for required field."]
  }
}
```

**Note:** Ingredients cascade delete when dish is deleted.

---

#### **2. List Dishes** 🔒 Chef ⚡
```http
GET /dishes?active_only=true
Authorization: Bearer {token}
```

**Cache:** This endpoint uses service-level caching. Results are cached for 5 minutes and automatically invalidate on dish updates.

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Pasta Carbonara",
      "price": "18.99",
      "category": "Main Course",
      "is_active": true,
      "ingredients": [{"id": 1, "name": "Spaghetti", "quantity": "400.00", "unit": "g", "is_optional": false}]
    }
  ],
  "message": "Retrieved 1 dishes"
}
```

---

#### **3. Get Dish** 🔒 Chef ⚡
```http
GET /dishes/{id}
Authorization: Bearer {token}
```

**Cache:** This endpoint uses service-level caching. Results are cached for 10 minutes and automatically invalidate on dish updates.

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Pasta Carbonara",
    "description": "Classic Italian pasta dish",
    "price": "18.99",
    "category": "Main Course",
    "prep_time": 30,
    "servings": 4,
    "photo_url": "https://res.cloudinary.com/...",
    "is_active": true,
    "ingredients": [
      {
        "id": 1,
        "name": "Spaghetti",
        "quantity": "400.00",
        "unit": "g",
        "is_optional": false
      }
    ],
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Dish not found or access denied",
  "message": "Dish not found or access denied",
  "status_code": 404
}
```

---

#### **4. Update Dish** 🔒 Chef
```http
PUT /dishes/{id}
Authorization: Bearer {token}

Body:
{
  "price": 25.99
}
```

**Note:** All fields are optional. Only provided non-null fields are updated.

**Note:** If `ingredients` is provided, it replaces the full ingredients list.

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Updated Dish Name",
    "price": "25.99",
    "is_active": true,
    "updated_at": "2025-12-13T11:00:00Z",
    "ingredients": []
  },
  "message": "Dish updated successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Dish not found or access denied",
  "message": "Dish not found or access denied",
  "status_code": 404
}
```

---

#### **5. Delete Dish** 🔒 Chef
```http
DELETE /dishes/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {},
  "message": "Dish deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Dish not found or access denied",
  "message": "Dish not found or access denied",
  "status_code": 404
}
```

---

### 📋 **Menu Module** (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** All endpoints require Chef authentication (🔒)
> **Cache:** 2 endpoints use service-level caching (⚡)
>
> **Note:** You can only manage your own menus. Each menu is automatically assigned to the authenticated chef.

#### **1. Create Menu** 🔒 Chef
```http
POST /menus
Authorization: Bearer {token}

Body:
{
  "name": "Summer Menu 2025",
  "description": "Fresh seasonal dishes",
  "status": "draft",
  "dish_ids": [1, 2, 3]
}
```

**Status Values:**
- `draft` (default)
- `published`
- `archived`
- `seasonal`

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Summer Menu 2025",
    "description": "Fresh seasonal dishes",
    "status": "draft",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "dishes": [],
    "dish_count": 0,
    "total_price": "0.00"
  },
  "message": "Menu created successfully"
}
```

**Error Response (400) - Duplicate menu name:**
```json
{
  "status": "error",
  "error": "You already have a menu named 'Summer Menu 2025'. Please use a different name.",
  "message": "You already have a menu named 'Summer Menu 2025'. Please use a different name.",
  "status_code": 400
}
```

---

#### **2. List Menus** 🔒 Chef ⚡
```http
GET /menus?active_only=true
Authorization: Bearer {token}
```

**Query Parameters:**
- `active_only` (boolean, optional; default=false): If true, only returns menus with status `published`

**Cache:** Results are cached for 5 minutes (TTL 300s) and invalidate on menu create/update/assign/delete.

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "chef_id": 1,
      "name": "Summer Menu 2025",
      "description": "Fresh seasonal dishes",
      "status": "published",
      "created_at": "2025-12-13T10:00:00Z",
      "updated_at": "2025-12-13T10:00:00Z",
      "dishes": [
        {
          "dish_id": 1,
          "order_position": 0,
          "dish": {
            "id": 1,
            "name": "Pasta Carbonara",
            "price": "18.99",
            "category": "Main Course",
            "photo_url": "https://example.com/pasta.jpg",
            "is_active": true
          }
        }
      ],
      "dish_count": 1,
      "total_price": "18.99"
    }
  ],
  "message": "Retrieved 1 menus"
}
```

---

#### **3. Get Menu** 🔒 Chef ⚡
```http
GET /menus/{id}
Authorization: Bearer {token}
```

**Cache:** Results are cached for 10 minutes (TTL 600s) and invalidate on menu update/assign/delete.

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Summer Menu 2025",
    "description": "Fresh seasonal dishes",
    "status": "published",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "dishes": [],
    "dish_count": 0,
    "total_price": "0.00"
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Menu not found or access denied",
  "message": "Menu not found or access denied",
  "status_code": 404
}
```

---

#### **4. Update Menu** 🔒 Chef
```http
PUT /menus/{id}
Authorization: Bearer {token}

Body (all fields optional):
{
  "name": "Updated Menu Name",
  "description": "New description",
  "status": "archived"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Updated Menu Name",
    "description": "New description",
    "status": "archived",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T11:00:00Z",
    "dishes": [],
    "dish_count": 0,
    "total_price": "0.00"
  },
  "message": "Menu updated successfully"
}
```

**Error Response (400) - Validation failed:**
```json
{
  "status": "error",
  "error": "Validation failed",
  "message": "Validation failed",
  "status_code": 400,
  "details": {
    "status": ["Must be one of: draft, published, archived, seasonal."]
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Menu not found or access denied",
  "message": "Menu not found or access denied",
  "status_code": 404
}
```

---

#### **5. Assign/Reorder Dishes** 🔒 Chef
```http
PUT /menus/{id}/dishes
Authorization: Bearer {token}

Body:
{
  "dishes": [
    {"dish_id": 1, "order_position": 0},
    {"dish_id": 2, "order_position": 1}
  ]
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "name": "Summer Menu 2025",
    "description": "Fresh seasonal dishes",
    "status": "draft",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T11:00:00Z",
    "dishes": [
      {
        "dish_id": 1,
        "order_position": 0,
        "dish": {
          "id": 1,
          "name": "Pasta Carbonara",
          "price": "18.99",
          "category": "Main Course",
          "photo_url": "https://example.com/pasta.jpg",
          "is_active": true
        }
      }
    ],
    "dish_count": 1,
    "total_price": "18.99"
  },
  "message": "Dishes assigned successfully"
}
```

**Error Response (400) - Dish not owned by chef:**
```json
{
  "status": "error",
  "error": "Dish 123 not found or does not belong to you",
  "message": "Dish 123 not found or does not belong to you",
  "status_code": 400
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Menu not found or access denied",
  "message": "Menu not found or access denied",
  "status_code": 404
}
```

---

#### **6. Delete Menu** 🔒 Chef
```http
DELETE /menus/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {},
  "message": "Menu deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Menu not found or access denied",
  "message": "Menu not found or access denied",
  "status_code": 404
}
```
### 💰 **Quotation Module** (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** All endpoints require Chef authentication (🔒)
>
> **Note:** You can only manage your own quotations. Each quotation is automatically assigned to the authenticated chef.

#### **1. Create Quotation** 🔒 Chef
```http
POST /quotations
Authorization: Bearer {token}

Body:
{
  "client_id": 1,
  "menu_id": 1,
  "event_date": "2025-12-25",
  "number_of_people": 50,
  "notes": "Wedding reception",
  "terms_and_conditions": "Payment due within 7 days.",
  "items": [
    {
      "dish_id": 1,
      "item_name": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "quantity": 50,
      "unit_price": 18.99
    }
  ]
}
```

**Quotation number format:** `QT-{chef_id}-{YYYYMMDD}-{sequence}`

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "client_id": 1,
    "menu_id": 1,
    "quotation_number": "QT-1-20251213-001",
    "event_date": "2025-12-25",
    "number_of_people": 50,
    "total_price": "949.50",
    "status": "draft",
    "notes": "Wedding reception",
    "terms_and_conditions": "Payment due within 7 days.",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "sent_at": null,
    "responded_at": null,
    "client": {
      "id": 1,
      "name": "John Client",
      "email": "client@example.com",
      "phone": "+1-555-0200",
      "company": "ABC Corp"
    },
    "menu": {
      "id": 1,
      "name": "Summer Menu 2025",
      "description": "Fresh seasonal dishes"
    },
    "items": [
      {
        "id": 1,
        "dish_id": 1,
        "item_name": "Pasta Carbonara",
        "description": "Classic Italian pasta",
        "quantity": 50,
        "unit_price": "18.99",
        "subtotal": "949.50"
      }
    ]
  },
  "message": "Quotation created successfully"
}
```

**Error Response (400) - Validation failed:**
```json
{
  "status": "error",
  "error": "Validation failed",
  "message": "Validation failed",
  "status_code": 400,
  "details": {
    "items": ["Shorter than minimum length 1."]
  }
}
```

---

#### **2. List Quotations** 🔒 Chef
```http
GET /quotations?status=draft
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (string, optional): `draft`, `sent`, `accepted`, `rejected`, `expired`

**Note:** If an unknown status value is provided, the API returns an empty list (200).

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "chef_id": 1,
      "client_id": 1,
      "menu_id": 1,
      "quotation_number": "QT-1-20251213-001",
      "event_date": "2025-12-25",
      "number_of_people": 50,
      "total_price": "949.50",
      "status": "draft",
      "notes": "Wedding reception",
      "terms_and_conditions": null,
      "created_at": "2025-12-13T10:00:00Z",
      "updated_at": "2025-12-13T10:00:00Z",
      "sent_at": null,
      "responded_at": null,
      "client": {
        "id": 1,
        "name": "John Client",
        "email": "client@example.com",
        "phone": "+1-555-0200",
        "company": "ABC Corp"
      },
      "menu": {
        "id": 1,
        "name": "Summer Menu 2025",
        "description": "Fresh seasonal dishes"
      },
      "items": [
        {
          "id": 1,
          "dish_id": 1,
          "item_name": "Pasta Carbonara",
          "description": "Classic Italian pasta",
          "quantity": 50,
          "unit_price": "18.99",
          "subtotal": "949.50"
        }
      ]
    }
  ],
  "message": "Retrieved 1 quotations"
}
```

---

#### **3. Get Quotation** 🔒 Chef
```http
GET /quotations/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "client_id": 1,
    "menu_id": 1,
    "quotation_number": "QT-1-20251213-001",
    "event_date": "2025-12-25",
    "number_of_people": 50,
    "total_price": "949.50",
    "status": "draft",
    "notes": "Wedding reception",
    "terms_and_conditions": null,
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "sent_at": null,
    "responded_at": null,
    "client": null,
    "menu": null,
    "items": []
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Quotation not found or access denied",
  "message": "Quotation not found or access denied",
  "status_code": 404
}
```

---

#### **4. Update Quotation** 🔒 Chef
> **Note:** Only `draft` quotations can be updated.

```http
PUT /quotations/{id}
Authorization: Bearer {token}

Body (all fields optional; if `items` is provided, it replaces all existing items):
{
  "number_of_people": 75,
  "notes": "Updated notes"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "quotation_number": "QT-1-20251213-001",
    "status": "draft",
    "number_of_people": 75,
    "total_price": "949.50",
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T11:00:00Z",
    "items": []
  },
  "message": "Quotation updated successfully"
}
```

**Error Response (400) - Not in draft status:**
```json
{
  "status": "error",
  "error": "Cannot update quotation with status 'sent'. Only draft quotations can be updated.",
  "message": "Cannot update quotation with status 'sent'. Only draft quotations can be updated.",
  "status_code": 400
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Quotation not found or access denied",
  "message": "Quotation not found or access denied",
  "status_code": 404
}
```

---

#### **5. Update Quotation Status** 🔒 Chef
```http
PATCH /quotations/{id}/status
Authorization: Bearer {token}

Body:
{
  "status": "sent"
}
```

**Valid transitions:**
- `draft` → `sent`, `expired`
- `sent` → `accepted`, `rejected`, `expired`
- `accepted` → `expired`

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "quotation_number": "QT-1-20251213-001",
    "status": "sent",
    "sent_at": "2025-12-13T11:00:00Z"
  },
  "message": "Quotation status updated to 'sent'"
}
```

**Error Response (400) - Invalid transition:**
```json
{
  "status": "error",
  "error": "Cannot transition from 'draft' to 'accepted'",
  "message": "Cannot transition from 'draft' to 'accepted'",
  "status_code": 400
}
```

---

#### **6. Delete Quotation** 🔒 Chef
> **Note:** Only `draft` quotations can be deleted.

```http
DELETE /quotations/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {},
  "message": "Quotation deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Quotation not found or access denied",
  "message": "Quotation not found or access denied",
  "status_code": 404
}
```

---

### 📅 **Appointment Module** (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** All endpoints require Chef authentication (🔒)
>
> **Note:** You can only manage your own appointments. Each appointment is automatically assigned to the authenticated chef.

#### **1. Create Appointment** 🔒 Chef
```http
POST /appointments
Authorization: Bearer {token}

Body:
{
  "client_id": 1,
  "title": "Menu Consultation",
  "description": "Discuss wedding menu options",
  "scheduled_at": "2025-12-20T14:00:00Z",
  "duration_minutes": 60,
  "location": "Chef Office",
  "meeting_url": "https://zoom.us/j/123456789",
  "notes": "Client prefers vegetarian"
}
```

**Notes:**
- `scheduled_at` must be in the future.
- If `client_id` is provided, the client must belong to the authenticated chef.

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "client_id": 1,
    "title": "Menu Consultation",
    "description": "Discuss wedding menu options",
    "scheduled_at": "2025-12-20T14:00:00Z",
    "duration_minutes": 60,
    "location": "Chef Office",
    "external_calendar_id": null,
    "external_calendar_provider": null,
    "meeting_url": "https://zoom.us/j/123456789",
    "status": "scheduled",
    "notes": "Client prefers vegetarian",
    "cancellation_reason": null,
    "created_at": "2025-12-13T10:00:00Z",
    "updated_at": "2025-12-13T10:00:00Z",
    "cancelled_at": null,
    "completed_at": null,
    "client": {
      "id": 1,
      "name": "John Client",
      "email": "client@example.com",
      "phone": "+1-555-0200",
      "company": "ABC Corp"
    },
    "end_time": "2025-12-20T15:00:00Z"
  },
  "message": "Appointment created successfully"
}
```

---

#### **2. List Appointments** 🔒 Chef
```http
GET /appointments?status=scheduled&start_date=2025-12-01T00:00:00Z&end_date=2025-12-31T23:59:59Z
Authorization: Bearer {token}
```

**Query Parameters (all optional):**
- `status` (string): `scheduled`, `confirmed`, `cancelled`, `completed`, `no_show`
- `start_date` (ISO datetime): filter appointments scheduled at/after this datetime
- `end_date` (ISO datetime): filter appointments scheduled at/before this datetime
- `upcoming` (boolean): if `true`, ignores the other filters and returns upcoming appointments
- `days` (integer; default=7): when `upcoming=true`, number of days to look ahead

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "chef_id": 1,
      "client_id": 1,
      "title": "Menu Consultation",
      "description": "Discuss wedding menu options",
      "scheduled_at": "2025-12-20T14:00:00Z",
      "duration_minutes": 60,
      "location": "Chef Office",
      "external_calendar_id": null,
      "external_calendar_provider": null,
      "meeting_url": null,
      "status": "scheduled",
      "notes": "Client prefers vegetarian",
      "cancellation_reason": null,
      "created_at": "2025-12-13T10:00:00Z",
      "updated_at": "2025-12-13T10:00:00Z",
      "cancelled_at": null,
      "completed_at": null,
      "client": null,
      "end_time": "2025-12-20T15:00:00Z"
    }
  ],
  "message": "Retrieved 1 appointments"
}
```

---

#### **3. Get Appointment** 🔒 Chef
```http
GET /appointments/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "chef_id": 1,
    "client_id": 1,
    "title": "Menu Consultation",
    "scheduled_at": "2025-12-20T14:00:00Z",
    "duration_minutes": 60,
    "status": "scheduled",
    "end_time": "2025-12-20T15:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Appointment not found or access denied",
  "message": "Appointment not found or access denied",
  "status_code": 404
}
```

---

#### **4. Update Appointment** 🔒 Chef
> **Note:** Appointments with status `completed` or `cancelled` cannot be updated.

```http
PUT /appointments/{id}
Authorization: Bearer {token}

Body (all fields optional):
{
  "duration_minutes": 90,
  "notes": "Extended consultation"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "duration_minutes": 90,
    "notes": "Extended consultation"
  },
  "message": "Appointment updated successfully"
}
```

---

#### **5. Update Appointment Status** 🔒 Chef
```http
PATCH /appointments/{id}/status
Authorization: Bearer {token}

Body:
{
  "status": "confirmed",
  "cancellation_reason": "Client requested reschedule"
}
```

**Valid statuses:** `scheduled`, `confirmed`, `cancelled`, `completed`, `no_show`

**Valid transitions:**
- `scheduled` → `confirmed`, `cancelled`
- `confirmed` → `completed`, `cancelled`, `no_show`

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "status": "confirmed"
  },
  "message": "Appointment status updated to 'confirmed'"
}
```

---

#### **6. Delete Appointment** 🔒 Chef
> **Note:** Completed appointments cannot be deleted.

```http
DELETE /appointments/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {},
  "message": "Appointment deleted successfully"
}
```

---
### 🛒 **Scraper Module** (⏳ DEFERRED / Post‑MVP)

> **Status:** Deferred for a future release. Scraper endpoints are **not available** in the current release.
>
> **Note:** This module will return in a future version with endpoints to manage price sources and scrape ingredient prices.

**Planned scope (not active):**
- `POST /scrapers/sources`
- `GET /scrapers/sources`
- `GET /scrapers/sources/:id`
- `PUT /scrapers/sources/:id`
- `DELETE /scrapers/sources/:id`
- `POST /scrapers/scrape`
- `GET /scrapers/prices`
- `GET /scrapers/prices/compare`
- `DELETE /scrapers/prices/cleanup`

---

## 🌍 Public Module (✅ IMPLEMENTED, ✅ VALIDATED, ⏳ PENDING MANUAL VALIDATION)

> **Authentication:** None (🌐 Public)
>
> **Cache:** All Public endpoints use route-level caching (⚡)
> - `GET /public/chefs` (5 minutes)
> - `GET /public/chefs/{id}` (10 minutes)
> - `GET /public/chefs/{id}/menus` (5 minutes)
> - `GET /public/search` (3 minutes)
> - `GET /public/filters` (30 minutes)
> - `GET /public/menus/{id}` (10 minutes)
> - `GET /public/dishes/{id}` (10 minutes)

#### **1. List Chefs** 🌐 Public ⚡
```http
GET /public/chefs?page=1&per_page=20&specialty=Italian&location=Miami&search=pasta
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: `1`, must be `>= 1`)
- `per_page` (integer, optional): Items per page (default: `20`, must be `1..100`)
- `specialty` (string, optional): Filter by chef specialty
- `location` (string, optional): Filter by chef location
- `search` (string, optional): Free-text search

**Success Response (200):**
```json
{
  "data": {
    "chefs": [
      {
        "id": 1,
        "bio": "Passionate chef...",
        "specialty": "Italian Cuisine",
        "phone": null,
        "location": "Miami, FL",
        "is_active": true,
        "created_at": "2025-12-13T10:00:00",
        "user": {
          "id": 10,
          "username": "chef_mario",
          "email": "mario@example.com"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "per_page": 20,
      "total_pages": 2
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "error": "Per page must be between 1 and 100",
  "message": "Per page must be between 1 and 100",
  "status_code": 400
}
```

---

#### **2. Get Chef Profile** 🌐 Public ⚡
```http
GET /public/chefs/{id}
```

**Success Response (200):**
```json
{
  "data": {
    "chef": {
      "id": 1,
      "bio": "Passionate chef...",
      "specialty": "Italian Cuisine",
      "phone": null,
      "location": "Miami, FL",
      "is_active": true,
      "created_at": "2025-12-13T10:00:00",
      "user": {
        "id": 10,
        "username": "chef_mario",
        "email": "mario@example.com"
      }
    },
    "dishes": [],
    "menus": [],
    "stats": {
      "total_dishes": 0,
      "total_menus": 0
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Chef with ID 999 not found or inactive",
  "message": "Chef with ID 999 not found or inactive",
  "status_code": 404
}
```

---

#### **3. Get Chef Menus (Paginated)** 🌐 Public ⚡
```http
GET /public/chefs/{id}/menus?page=1&per_page=6
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: `1`, must be `>= 1`)
- `per_page` (integer, optional): Items per page (default: `6`, must be `1..50`)

**Success Response (200):**
```json
{
  "data": {
    "menus": [
      {
        "id": 1,
        "chef_id": 1,
        "name": "Summer Menu",
        "description": "Fresh seasonal dishes",
        "status": "published",
        "dish_count": 2,
        "total_price": "27.98",
        "dishes": [
          {
            "dish_id": 5,
            "order_position": 0,
            "dish": {
              "id": 5,
              "name": "Pasta Carbonara",
              "photo_url": "https://example.com/pasta.jpg",
              "price": "18.99",
              "category": "Main Course",
              "is_active": true
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "per_page": 6,
      "total_pages": 1
    }
  }
}
```

**Error Response (404):**
```json
{
  "status": "error",
  "error": "Chef with ID 999 not found or inactive",
  "message": "Chef with ID 999 not found or inactive",
  "status_code": 404
}
```

---

#### **4. Search Chefs** 🌐 Public ⚡
```http
GET /public/search?q=mi&page=1&per_page=20
```

**Query Parameters:**
- `q` (string, required): Search query (minimum length: `2`)
- `page` (integer, optional): Page number (default: `1`)
- `per_page` (integer, optional): Items per page (default: `20`)

**Success Response (200):**
```json
{
  "data": {
    "query": "mi",
    "chefs": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "per_page": 20,
      "total_pages": 0
    }
  }
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "error": "Search query must be at least 2 characters",
  "message": "Search query must be at least 2 characters",
  "status_code": 400
}
```

---

#### **5. Get Filters** 🌐 Public ⚡
```http
GET /public/filters
```

**Success Response (200):**
```json
{
  "data": {
    "specialties": [
      "Italian Cuisine",
      "French Cuisine"
    ],
    "locations": [
      "Miami, FL",
      "New York, NY"
    ]
  }
}
```

---

#### **6. Get Menu Details** 🌐 Public ⚡
```http
GET /public/menus/{id}
```

**Success Response (200):**
```json
{
  "data": {
    "menu": {
      "id": 1,
      "chef_id": 1,
      "name": "Summer Menu",
      "description": "Fresh seasonal dishes",
      "status": "published",
      "is_active": true,
      "created_at": "2025-12-13T10:00:00",
      "updated_at": "2025-12-13T10:00:00",
      "dishes": []
    },
    "chef": {
      "id": 1,
      "bio": "Passionate chef...",
      "specialty": "Italian Cuisine",
      "phone": null,
      "location": "Miami, FL",
      "is_active": true,
      "created_at": "2025-12-13T10:00:00",
      "user": {
        "id": 10,
        "username": "chef_mario",
        "email": "mario@example.com"
      }
    },
    "dishes": [
      {
        "id": 5,
        "chef_id": 1,
        "name": "Pasta Carbonara",
        "description": "Classic pasta",
        "price": "18.99",
        "category": "Main Course",
        "preparation_steps": null,
        "prep_time": 20,
        "servings": 2,
        "photo_url": null,
        "is_active": true,
        "created_at": "2025-12-13T10:00:00",
        "updated_at": "2025-12-13T10:00:00",
        "ingredients": [],
        "order_position": 1
      }
    ]
  }
}
```

---

#### **7. Get Dish Details** 🌐 Public ⚡
```http
GET /public/dishes/{id}
```

**Success Response (200):**
```json
{
  "data": {
    "dish": {
      "id": 5,
      "chef_id": 1,
      "name": "Pasta Carbonara",
      "description": "Classic pasta",
      "price": "18.99",
      "category": "Main Course",
      "preparation_steps": null,
      "prep_time": 20,
      "servings": 2,
      "photo_url": null,
      "is_active": true,
      "created_at": "2025-12-13T10:00:00",
      "updated_at": "2025-12-13T10:00:00",
      "ingredients": []
    },
    "chef": {
      "id": 1,
      "bio": "Passionate chef...",
      "specialty": "Italian Cuisine",
      "phone": null,
      "location": "Miami, FL",
      "is_active": true,
      "created_at": "2025-12-13T10:00:00",
      "user": {
        "id": 10,
        "username": "chef_mario",
        "email": "mario@example.com"
      }
    }
  }
}
```
```

---

#### **3. Search Chefs** 🌐 Public
```http
GET /public/search?q=pasta&page=1&per_page=10
```

**Query Parameters:**
- `q`: Search query (minimum 3 characters)
- `page`: Page number
- `per_page`: Items per page

---

#### **4. Get Filters** 🌐 Public
```http
GET /public/filters
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "specialties": [
      "Italian Cuisine",
      "French Cuisine",
      "Mexican Cuisine"
    ],
    "locations": [ Use these endpoints instead of the deprecated `/chefs` routes.

#### **1. List Chefs** 🌐 Public ⚡
```http
GET /public/chefs?page=1&per_page=10&specialty=Italian&location=Miami&search=pasta
```

**Cache:** This endpoint uses route-level caching. Results are cached for 5 minutes.
}
```

---

#### **5. Get Menu Details** 🌐 Public
```http
GET /public/menus/{id}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "menu": {
      "id": 1,
      "name": "Summer Menu 2025",
      "description": "Fresh seasonal dishes"
    },
    "chef": {
      "id": 1,
      "specialty": "Italian Cuisine"
    },
    "dishes": [...]
  }
}
```

---

#### **7. Get Dish Details** 🌐 Public
```http
GET /public/dishes/{id}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "dish": {
      "id": 1,
      "name": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "price": 18.99,
      "ingredients": [...]
    },
    "chef": {
      "id": 1,
      "specialty": "Italian Cuisine"
    }
  }
}
```
        "description": "Traditional Italian dessert",
        "price": 8.99,
        "order_position": 2
      }
    ]
  },
  "message": "Menu retrieved successfully"
}
```

**Note:** Los platos vienen ordenados según `order_position`.

---

#### **7. Get Dish Details**
```http
GET /public/dishes/{dish_id}
```

**Response:**
```json
{
  "data": {
    "dish": {
      "id": 1,
      "name": "Spaghetti Carbonara",
      "description": "Classic Roman pasta with eggs, cheese, and guanciale",
      "category": "Main Course",
      "price": 18.99,
      "preparation_time": 20,
      "serves": 2,
      "is_available": true,
      "ingredients": [
        {
          "name": "Spaghetti",
          "quantity": 200,
          "unit": "g"
        },
        {
          "name": "Eggs",
          "quantity": 3,
          "unit": "units"
        }
      ]
    },
    "chef": {
      "id": 1,
      "name": "Mario Rossi",
      "specialty": "Italian Cuisine",
      "location": "Miami, FL"
    }
  },
  "message": "Dish retrieved successfully"
}
```

**Note:** Incluye información completa del plato y del chef que lo prepara.

---

## 👑 Admin Module (✅ IMPLEMENTED)

> **Authentication:** All endpoints require Admin authentication (👑)
> 
> **Note:** Administrators have full system access for supervision, management, and moderation of all resources. Complete implementation documentation: [ADMIN_PHASE3_COMPLETED.md](../archive/ADMIN_PHASE3_COMPLETED.md)

### 🎯 Admin Module Purpose

Admin endpoints are designed for:
- **Supervision**: Centralized monitoring of all chefs and activities
- **Moderation**: Activate/deactivate problematic accounts
- **Analytics**: System-wide metrics and statistics
- **Support**: User assistance without compromising security
- **Audit**: Tracking of all administrative actions

---

#### **1. Admin Dashboard** 👑 Admin
```http
GET /admin/dashboard
Authorization: Bearer {admin_token}
```

**Purpose:** Overview with key system metrics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_chefs": 150,
      "active_chefs": 142,
      "inactive_chefs": 8,
      "total_clients": 856,
      "total_dishes": 1243,
      "total_menus": 387,
      "total_quotations": 524,
      "total_appointments": 892
    },
    "recent_activity": {
      "new_chefs_last_7_days": 5,
      "new_clients_last_7_days": 23,
      "quotations_last_7_days": 18
    },
    "top_chefs": [
      {
        "chef_id": 1,
        "username": "chef_mario",
        "total_clients": 45,
        "total_dishes": 32,
        "total_quotations": 67
      }
    ]
  },
  "message": "Dashboard data retrieved successfully"
}
```

**Cache:** 5 minutes

---

#### **2. List All Chefs (Admin View)** 👑 Admin
```http
GET /admin/chefs?page=1&per_page=20&status=all&search=mario&sort=created_at&order=desc
Authorization: Bearer {admin_token}
```

**Purpose:** View ALL chefs with advanced filters (unlike GET /chefs which is public)

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 100)
- `status` (string): "active" | "inactive" | "all" (default: "all")
- `search` (string): Search by username, email, specialty
- `sort` (string): "created_at" | "username" | "total_clients" (default: "created_at")
- `order` (string): "asc" | "desc" (default: "desc")

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chefs": [
      {
        "id": 1,
        "bio": "Passionate Italian chef with 10+ years experience",
        "specialty": "Italian Cuisine",
        "phone": "+1-555-0100",
        "location": "Miami, FL",
        "is_active": true,
        "created_at": "2025-10-01T10:00:00Z",
        "user": {
          "id": 1,
          "username": "chef_mario",
          "email": "mario@example.com",
          "role": "chef"
        },
        "stats": {
          "total_clients": 45,
          "total_dishes": 32,
          "total_menus": 8,
          "total_quotations": 67
        }
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 150,
      "pages": 8
    }
  },
  "message": "Retrieved 150 chefs"
}
```

---

#### **3. Get Chef Details (Admin View)** 👑 Admin
```http
GET /admin/chefs/{id}
Authorization: Bearer {admin_token}
```

**Purpose:** View complete profile of any chef with all statistics

**URL Parameters:**
- `id` (integer, required): Chef ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chef": {
      "id": 1,
      "bio": "Passionate Italian chef...",
      "specialty": "Italian Cuisine",
      "phone": "+1-555-0100",
      "location": "Miami, FL",
      "is_active": true,
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-12-10T15:30:00Z",
      "user": {
        "id": 1,
        "username": "chef_mario",
        "email": "mario@example.com",
        "role": "chef"
      }
    },
    "statistics": {
      "total_clients": 45,
      "total_dishes": 32,
      "active_dishes": 30,
      "total_menus": 8,
      "active_menus": 6,
      "total_quotations": 67,
      "quotations_by_status": {
        "draft": 5,
        "sent": 12,
        "accepted": 38,
        "rejected": 10,
        "expired": 2
      },
      "total_appointments": 89,
      "appointments_by_status": {
        "scheduled": 8,
        "confirmed": 15,
        "completed": 62,
        "cancelled": 4
      }
    },
    "recent_activity": {
      "last_login": "2025-12-13T08:30:00Z",
      "last_dish_created": "2025-12-12T14:20:00Z",
      "last_quotation_sent": "2025-12-11T10:15:00Z"
    }
  },
  "message": "Chef details retrieved successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Chef not found"
}
```

---

#### **4. Update Chef Status** 👑 Admin
```http
PATCH /admin/chefs/{id}/status
Authorization: Bearer {admin_token}

Body:
{
  "is_active": false,
  "reason": "Terms of service violation"
}
```

**Purpose:** Activate/deactivate chef account

**Request Body:**
- `is_active` (boolean, required): true to activate, false to deactivate
- `reason` (string, optional): Reason for status change

**Business Rules:**
- Deactivating chef does NOT delete their data
- Deactivated chef CANNOT login
- Chef's public data remains visible but marked as "inactive"
- Action is logged in audit logs

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "chef_id": 1,
    "is_active": false,
    "updated_at": "2025-12-13T10:30:00Z"
  },
  "message": "Chef account deactivated successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Chef not found"
}
```

---

#### **5. List All Users** 👑 Admin
```http
GET /admin/users?page=1&per_page=20&role=all&status=active
Authorization: Bearer {admin_token}
```

**Purpose:** Complete user management system

**Query Parameters:**
- `page` (int): Número de página (default: 1)
- `per_page` (int): Items por página (default: 20, max: 100)
- `role` (string): "chef" | "admin" | "all" (default: "all")
- `status` (string): "active" | "inactive" | "all" (default: "all")
- `search` (string): Búsqueda por username o email

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "chef_mario",
        "email": "mario@example.com",
        "role": "chef",
        "is_active": true,
        "has_chef_profile": true,
        "created_at": "2025-10-01T10:00:00Z",
        "last_login": "2025-12-13T08:30:00Z"
      },
      {
        "id": 2,
        "username": "admin_user",
        "email": "admin@Savora.com",
        "role": "admin",
        "is_active": true,
        "has_chef_profile": false,
        "created_at": "2025-09-01T09:00:00Z",
        "last_login": "2025-12-13T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 151,
      "pages": 8
    }
  },
  "message": "Retrieved 151 users"
}
```

---

#### **6. Delete User** 👑 Admin
```http
DELETE /admin/users/{id}
Authorization: Bearer {admin_token}

Body:
{
  "confirm": true,
  "reason": "Account deletion requested by user"
}
```

**Purpose:** Delete user from system (soft delete)

**⚠️ Business Rules:**
- SOFT DELETE: Mark as deleted, do not physically delete
- Admin CANNOT delete themselves
- Must have at least 1 active admin in the system
- Cascade: delete associated chef profile if exists

**Request Body:**
- `confirm` (boolean, required): Must be true to confirm
- `reason` (string, optional): Reason for deletion

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "deleted_at": "2025-12-13T10:30:00Z"
  },
  "message": "User deleted successfully"
}

**Note:** This endpoint returns `user_id` instead of the complete object as it's a deletion operation.
```

**Error Responses:**

403 Forbidden - Intento de auto-eliminación:
```json
{
  "success": false,
  "error": "Cannot delete your own account"
}
```

403 Forbidden - Último admin:
```json
{
  "success": false,
  "error": "Cannot delete the last active admin"
}
```

400 Bad Request - Confirmación faltante:
```json
{
  "success": false,
  "error": "Confirmation required. Set 'confirm' to true"
}
```

---

#### **7. System Reports** 👑 Admin
```http
GET /admin/reports?report_type=activity&start_date=2025-11-01T00:00:00Z&end_date=2025-11-30T23:59:59Z&format=json
Authorization: Bearer {admin_token}
```

**Purpose:** System reports and analysis

**Query Parameters:**
- `report_type` (string, required): "chefs" | "activity" | "revenue" | "quotations"
- `start_date` (ISO datetime, required): Fecha inicio del periodo
- `end_date` (ISO datetime, required): Fecha fin del periodo
- `format` (string): "json" | "csv" (default: "json")

**Success Response (200) - Activity Report:**
```json
{
  "success": true,
  "data": {
    "report_type": "activity",
    "period": {
      "start": "2025-11-01T00:00:00Z",
      "end": "2025-11-30T23:59:59Z"
    },
    "metrics": {
      "new_users": 12,
      "new_chefs": 10,
      "new_clients": 89,
      "dishes_created": 156,
      "menus_created": 34,
      "quotations_sent": 78,
      "quotations_accepted": 45,
      "appointments_scheduled": 123,
      "appointments_completed": 98
    },
    "trends": {
      "user_growth_rate": "+8.5%",
      "quotation_acceptance_rate": "57.7%",
      "appointment_completion_rate": "79.7%"
    }
  },
  "message": "Activity report generated successfully"
}
```

---

#### **8. Audit Logs** 👑 Admin
```http
GET /admin/audit-logs?page=1&per_page=50&admin_id=2&action_type=deactivate_chef
Authorization: Bearer {admin_token}
```

**Purpose:** Tracking of all administrative actions

**Query Parameters:**
- `page` (int): Número de página (default: 1)
- `per_page` (int): Items por página (default: 50, max: 200)
- `admin_id` (int): Filtrar por admin específico
- `action_type` (string): Tipo de acción ("deactivate_chef", "delete_user", etc.)
- `start_date` (ISO datetime): Fecha inicio
- `end_date` (ISO datetime): Fecha fin

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "admin_id": 2,
        "admin_username": "admin_user",
        "action": "deactivate_chef",
        "target_type": "chef",
        "target_id": 5,
        "reason": "Terms of service violation",
        "ip_address": "192.168.1.100",
        "created_at": "2025-12-13T10:30:00Z"
      },
      {
        "id": 2,
        "admin_id": 2,
        "admin_username": "admin_user",
        "action": "delete_user",
        "target_type": "user",
        "target_id": 23,
        "reason": "User request",
        "ip_address": "192.168.1.100",
        "created_at": "2025-12-12T15:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 50,
      "total": 234,
      "pages": 5
    }
  },
  "message": "Retrieved 234 audit logs"
}
```

**Logged Actions:**
- `deactivate_chef` / `activate_chef`
- `delete_user`
- `view_chef_details` (para compliance)
- `generate_report`
- `view_audit_logs`
- `view_audit_statistics`
- Cualquier acción admin se registra automáticamente

---

#### **9. Audit Statistics** 👑 Admin
```http
GET /admin/audit-logs/statistics
Authorization: Bearer {admin_token}
```

**Purpose:** Aggregated audit log statistics

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_logs": 1247,
    "recent_logs_7_days": 156,
    "logs_by_action": {
      "view_dashboard": 423,
      "view_all_chefs": 287,
      "view_chef_details": 189,
      "deactivate_chef": 12,
      "activate_chef": 8,
      "view_all_users": 145,
      "delete_user": 5,
      "generate_report": 89,
      "view_audit_logs": 67,
      "view_audit_statistics": 22
    },
    "top_admins": [
      {
        "admin_id": 2,
        "username": "admin_user",
        "action_count": 834
      },
      {
        "admin_id": 3,
        "username": "admin_supervisor",
        "action_count": 413
      }
    ]
  },
  "message": "Audit statistics retrieved successfully"
}
```

**Metrics Included:**
- Total logs count
- Recent activity (last 7 days)
- Actions grouped by type
- TOP 5 most active admins

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": ["Invalid email format"],
    "password": ["Password too short"]
  }
}
```

---

## 🔑 Token Authentication Summary

**To get the token:**

1. Register: `POST /auth/register` → Creates account with `chef` role by default
2. Login: `POST /auth/login` → Returns JWT token
3. Use the token: Include in header `Authorization: Bearer {token}` for all 🔒 endpoints

**Icon legend:**
- 🌐 **Public**: No authentication required, anyone can access
- 🔒 **Chef**: Requires chef authentication (valid JWT token)
- 👑 **Admin**: Requires admin authentication (JWT token + admin role)
- ⚡ **Cached**: Endpoint uses caching for improved performance

**Important notes:**
- Token expires in 24 hours
- Each chef only sees/manages their own resources (clients, dishes, menus, etc.)
- Admins can view/manage resources from ALL chefs
- To create content, an admin must have a separate chef profile
- All admin actions are logged in audit logs
- Cached endpoints (⚡) provide faster responses after the first request

---

**Last Updated:** January 2, 2026  
**API Version:** 1.0.0  
**Total Endpoints:** 61 (10 public + 40 chef + 11 admin)  
**Cached Endpoints:** 9 (marked with ⚡)  
**Status:** 60 endpoints implemented ✅ | 497 tests (85% unit-test coverage)
