# 🍳 Savora - Development Plan

## 📋 Tech Stack

### Backend
- **Framework**: Flask 3.1+
- **Database**: PostgreSQL + SQLAlchemy 2.0
- **Auth**: OAuth2 + JWT (PyJWT + bcrypt)
- **PDF**: WeasyPrint (HTML/CSS → PDF)
- **Email**: SMTP (Mailtrap for dev/testing)
- **Images**: Cloudinary SDK
- **Validation**: Marshmallow
- **Testing**: pytest + coverage
- **Scraping**: Deferred (Post‑MVP)
- **Scheduling**: Calendly API / Google Calendar API

### Frontend
- **Framework**: Vanilla JavaScript (ES6 Modules)
- **HTTP**: Axios
- **Styles**: CSS3 (modular)
- **Storage**: LocalStorage + API
- **Upload**: Cloudinary Widget

### DevOps
- **Cache**: Redis (optional for optimization)
- **Variables**: python-dotenv
- **CORS**: flask-cors

---

## ✅ Audit Follow-ups Implemented (Jan 2026)

### Rate Limiting
- Implemented Flask-Limiter with a shared limiter instance.
- Per-route limits applied to auth (scrapers deferred).
- Disabled automatically for test runs (`FLASK_ENV=testing` or `TESTING=True`).

### Email Sending (SMTP / Mailtrap)
- Best-effort welcome email on successful registration.
- Automatically disabled unless `EMAIL_ENABLED=true` and `MAILTRAP_USERNAME`/`MAILTRAP_PASSWORD` are configured.

### PDF Generation (WeasyPrint)
- Added a quotation PDF download endpoint.
- WeasyPrint import is lazy; endpoint returns an error if PDF generation is unavailable.

### Calendar Integration
- Implemented appointment export as an iCalendar `.ics` download (works with Google Calendar / Apple Calendar / Outlook import).
- Full Google Calendar OAuth + two-way sync is not implemented yet (future enhancement).

### Testing Agent Checklist
- **Rate limiting**: verify `429` responses and RateLimit headers in non-testing env; ensure limiter disabled in unit tests.
- **Email**: when email is enabled and SMTP credentials are set, registration triggers a send; failures must not break registration.
- **PDF**: `GET /quotations/:id/pdf` returns `application/pdf` for owned quotation; verify access denied behavior; verify error when WeasyPrint unavailable.
- **Calendar (.ics)**: `GET /appointments/:id/calendar.ics` returns `text/calendar`; verify start/end times reflect `scheduled_at` + `duration_minutes` and access control.

---

## 🗄️ Database

### Multi-Schema Organization

**Schema `auth`** - Authentication and users

**1. auth.users**
- id, username, email, password_hash, role (chef/admin), profile_photo_url
- created_at, updated_at

**Schema `core`** - Main business logic

**2. core.chefs**
- id, user_id (FK → auth.users), bio, specialty, phone, location, is_active
- created_at, updated_at

**3. core.clients**
- id, chef_id (FK → core.chefs), name, email, phone, company, notes
- created_at, updated_at

**4. core.dishes**
- id, chef_id (FK → core.chefs), name, description, price, category
- preparation_steps, prep_time, servings
- photo_url, is_active, created_at, updated_at

**5. core.ingredients**
- id, dish_id (FK → core.dishes), name, quantity, unit, is_optional
- created_at, updated_at

**6. core.menus**
- id, chef_id (FK → core.chefs), name, description, status (active/inactive)
- created_at, updated_at

**7. core.menu_dishes** (many-to-many)
- menu_id (FK → core.menus), dish_id (FK → core.dishes), order_position

**8. core.quotations**
- id, chef_id (FK → core.chefs), client_id (FK → core.clients), menu_id (FK → core.menus, nullable)
- quotation_number, total_amount, status (draft/sent/accepted/rejected)
- valid_until, notes, pdf_url
- created_at, sent_at, updated_at

**9. core.quotation_items** (additional items without menu)
- id, quotation_id (FK → core.quotations), description, quantity, unit_price, subtotal

**Schema `integrations`** - External services

**10. integrations.appointments**
- id, chef_id (FK → core.chefs), client_id (FK → core.clients, nullable)
- client_name, client_email, client_phone
- appointment_date, appointment_time, duration_minutes, status (pending/confirmed/cancelled)
- calendly_event_id, google_event_id, notes
- created_at, updated_at

**11. integrations.scraped_products** (cached product data, deferred / Post‑MVP)
- id, ingredient_name, store_name, product_name, price, url, image_url
- last_scraped_at, created_at

### Cross-Schema Relationships
- auth.users (1) ←→ (1) core.chefs
- core.chefs (1) → (N) core.clients
- core.chefs (1) → (N) core.dishes
- core.chefs (1) → (N) core.menus
- core.chefs (1) → (N) core.quotations
- core.chefs (1) → (N) integrations.appointments
- core.menus (N) ←→ (N) core.dishes (through core.menu_dishes)
- core.quotations (N) → (1) core.menus (optional)
- core.quotations (1) → (N) core.quotation_items
- core.dishes (1) → (N) core.ingredients
- core.clients (1) → (N) integrations.appointments

### Multi-Schema Organization Benefits
- **Clarity**: Logical separation of modules
- **Security**: Granular permissions per schema
- **Scalability**: Easy to add new modules/schemas
- **Maintainability**: More organized migrations

---

## 🏗️ Backend Architecture

### Pattern: 3-Tier Layered Architecture

```
┌─────────────────────────────────────┐
│   PRESENTATION LAYER                │ ← Routes, Controllers
├─────────────────────────────────────┤
│   BUSINESS LOGIC LAYER              │ ← Services
├─────────────────────────────────────┤
│   DATA ACCESS LAYER                 │ ← Repositories, Models
└─────────────────────────────────────┘
```

### Layer Responsibilities

#### **Routes Layer** (`routes/`)
- Blueprint registration and route definition
- Authentication decorators (@admin_required, @jwt_required)
- Delegation to controllers
- **NO** business logic

#### **Controllers Layer** (`controllers/`)
- HTTP request/response handling
- Schema validation (Marshmallow)
- JSON response formatting
- HTTP error handling
- Delegation to services
- **NO** direct database access

#### **Services Layer** (`services/`)
- Business logic
- Operation orchestration
- Complex validations
- Cache management (Redis)
- Delegation to repositories
- **NO** direct HTTP handling

#### **Repositories Layer** (`repositories/`)
- CRUD database operations
- SQLAlchemy queries
- Transactions
- **ONLY** data access, no business logic

#### **Models Layer** (`models/`)
- Table definitions (SQLAlchemy ORM)
- Model relationships
- Enums and constraints

#### **Schemas Layer** (`schemas/`)
- Input validation (Marshmallow)
- Serialization/deserialization
- Request and response schemas

---

## � Architectural Decisions

### Public vs Protected Endpoints Separation (December 2025)

**Decision**: Deprecate basic `/chefs` and `/chefs/:id` public browsing endpoints.

**Context**:
- Originally had duplicate functionality: `/chefs` (basic) and `/public/chefs` (advanced)
- Both served the same purpose: browsing chef profiles
- `/public/chefs` had superior implementation with caching, filters, and pagination

**Rationale**:
1. **Performance**: Public endpoints use Redis cache (5-10min TTL) reducing database load
2. **Semantic Clarity**: 
   - `/chefs/profile` = Authenticated chef managing own profile (protected)
   - `/public/chefs` = Anyone browsing chef listings (public, cached, filtered)
3. **Maintainability**: One way to do each thing eliminates confusion
4. **Scalability**: Caching layer essential for public-facing features

**Impact**:
- Reduced total endpoints from 62 to 60
- Chef module now has 3 focused endpoints (profile management only)
- All public browsing consolidated under `/public/*` namespace
- Improved cache hit rate and clearer API structure

**Implementation Date**: December 28, 2025

---

## �📁 Project Structure

```
Savora/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── blueprints.py           # Blueprint registration
│   │   │
│   │   ├── auth/                   # Authentication module
│   │   │   ├── __init__.py
│   │   │   ├── models/
│   │   │   │   └── user_model.py
│   │   │   ├── schemas/
│   │   │   │   └── user_schema.py
│   │   │   ├── repositories/
│   │   │   │   └── user_repository.py
│   │   │   ├── services/
│   │   │   │   ├── auth_service.py
│   │   │   │   └── security_service.py
│   │   │   ├── controllers/
│   │   │   │   └── auth_controller.py
│   │   │   └── routes/
│   │   │       └── auth_routes.py
│   │   │
│   │   ├── chefs/                  # Chef profiles
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── routes/
│   │   │
│   │   ├── clients/                # Client management
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── controllers/
│   │   │   └── routes/
│   │   │
│   │   ├── dishes/                 # Dish CRUD
│   │   ├── menus/                  # Menu CRUD
│   │   ├── quotations/             # Quotations + PDF
│   │   ├── appointments/           # Calendar scheduling
│   │   ├── scrapers/               # Deferred (Post‑MVP)
│   │   ├── public/                 # Landing + chef profiles (no auth)
│   │   │
│   │   └── core/                   # Shared infrastructure
│   │       ├── database.py         # SQLAlchemy setup
│   │       ├── cache_manager.py    # Redis cache (optional)
│   │       ├── middleware/         # JWT decorators, RBAC
│   │       │   ├── auth_middleware.py
│   │       │   └── cache_decorators.py
│   │       └── lib/                # Utilities
│   │           ├── error_utils.py
│   │           ├── jwt_utils.py
│   │           └── validators.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── logging.py
│   │   └── .env
│   │
│   ├── scripts/
│   │   ├── init_db.py
│   │   ├── seed_admin.py
│   │   └── run_tests.py
│   │
│   ├── tests/
│   │   ├── conftest.py             # Shared fixtures
│   │   ├── setup_test_db.py        # DB setup script
│   │   ├── TESTING_GUIDE.md        # Commands & setup (70 lines)
│   │   ├── unit/                   # ✅ 161 tests
│   │   │   ├── test_auth.py        # 16 tests
│   │   │   ├── test_appointments.py # 12 tests
│   │   │   ├── test_chefs.py       # 3 tests
│   │   │   ├── test_clients.py     # 8 tests
│   │   │   ├── test_dishes.py      # 14 tests
│   │   │   ├── test_menus.py       # 9 tests
│   │   │   ├── test_quotations.py  # 8 tests
│   │   │   ├── test_scrapers.py    # Deferred (Post‑MVP)
│   │   │   ├── test_admin.py       # 16 + 43 coverage
│   │   │   ├── test_public.py      # 15 tests
│   │   │   └── test_helpers.py     # Utilities
│   │   └── integration/            # ✅ 135 tests (Docker-based)
│   │       ├── VALIDATION_RESULTS.md
│   │       └── test_*.py           # Per-module API tests
│   │
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── index.html              # Landing page
│   ├── README.md               # Frontend documentation
│   ├── pages/
│   │   ├── auth/               # Login, Register
│   │   └── dashboard/          # Protected pages (clients, dishes, etc.)
│   ├── components/             # Reusable UI components
│   ├── scripts/
│   │   ├── core/               # App config, router, session
│   │   ├── services/           # API clients
│   │   └── views/              # Page-specific logic
│   ├── styles/
│   │   ├── main.css            # Global styles
│   │   └── dashboard.css       # Dashboard styles
│   └── utils/                  # Shared utilities
│
└── docs/
    ├── backend/                # Backend docs
    ├── frontend/               # Frontend docs
    ├── decisions/              # ADRs (Architectural Decision Records)
    └── archive/                # Historical docs
```

---

## 📐 Flow Example (Auth Module)

### File structure:
```python
app/auth/
├── models/
│   └── user_model.py          # User ORM model
├── schemas/
│   └── user_schema.py         # UserRegisterSchema, UserLoginSchema
├── repositories/
│   └── user_repository.py     # get_by_email(), create(), etc.
├── services/
│   ├── auth_service.py        # register_user(), authenticate_user()
│   └── security_service.py    # hash_password(), verify_password()
├── controllers/
│   └── auth_controller.py     # HTTP handling, response formatting
└── routes/
    └── auth_routes.py         # Blueprint registration
```

### Execution flow:
```
1. REQUEST:  POST /auth/register
             ↓
2. ROUTE:    auth_routes.py → AuthAPI.post()
             ↓
3. CONTROLLER: AuthController.register()
             - Validates with UserRegisterSchema
             - Extracts request data
             ↓
4. SERVICE:  AuthService.register_user()
             - Verifies unique email
             - Hash password (SecurityService)
             - Orchestrates User + Chef creation
             ↓
5. REPOSITORY: UserRepository.create()
             - db.add(user)
             - db.commit()
             ↓
6. RESPONSE: Controller formats response
             - UserResponseSchema.dump(user)
             - return jsonify(...), 201
```

---

## 🎯 Development Phases

### **Phase 1: Foundation (Week 1-2)** ✅ COMPLETED
1. ✅ Initial setup (repos, venv, DB)
2. ✅ Create PostgreSQL multi-schema
3. ✅ SQLAlchemy models (11 tables)
4. ✅ Backend: Auth (register, login, JWT)
5. ✅ Protected routes middleware
6. ✅ **93 Unit Tests (100% passing)**

### **Phase 2: Base Management (Week 3-4)** ✅ COMPLETED
1. ✅ Backend: Clients CRUD
2. ✅ Backend: Dishes CRUD + Cloudinary upload
3. ✅ Backend: Comprehensive testing suite
4. ⏳ Frontend: Clients page (table + forms)
5. ⏳ Frontend: Dishes page (cards + upload)

### **Phase 3: Menus (Week 5)** ✅ COMPLETED
1. ✅ Backend: Menus CRUD + dish assignment
2. ✅ Active/Inactive status toggle
3. ⏳ Frontend: Menu builder (optional drag & drop)

### **Phase 4: Quotations (Week 6-7)** ✅ BACKEND COMPLETED
1. ✅ Backend: Quotations CRUD
2. ⏳ Backend: PDF generation (WeasyPrint)
3. ⏳ Backend: SMTP email integration
4. ⏳ Frontend: Quotation form + preview

### **Phase 5: Advanced Features (Week 8-9)** 🔄 IN PROGRESS
1. ⏳ Backend: Ingredients model + scraper service (Deferred / Post‑MVP)
2. ⏳ Backend: Web scraping (Deferred / Post‑MVP)
3. ⏳ Frontend: Ingredient search + price comparison (Deferred / Post‑MVP)
4. ✅ Backend: Appointments CRUD
5. ⏳ Backend: Calendly/Google Calendar API
6. ⏳ Frontend: Calendar widget + booking system

### **Phase 6: Public (Week 10)** ✅ BACKEND COMPLETED
1. ✅ Backend: Public endpoints (chef list, search, profiles)
2. ⏳ Landing page (chef list)
3. ⏳ Chef profile page (public)
4. ⏳ Contact form + booking integration
5. ⏳ Basic SEO

### **Phase 7: Polish (Week 11)** ⏳ PENDING
1. ⏳ Integration tests (external services)
2. ⏳ Error handling refinement
3. ⏳ UI/UX improvements
4. ⏳ Frontend implementation
5. ✅ API Documentation (60 endpoints)

---

## 🔑 API Endpoints

**Ver documentación completa**: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

**Total: 57 endpoints activos (Scraper deferred / Post‑MVP)**

### Auth (4 endpoints)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- GET /auth/me

### Chefs (3 endpoints)
- GET /chefs/profile
- PUT /chefs/profile
- GET /chefs/statistics

### Clients (5 endpoints)
- GET /clients
- POST /clients
- GET /clients/:id
- PUT /clients/:id
- DELETE /clients/:id

### Dishes (5 endpoints)
- GET /dishes
- POST /dishes
- GET /dishes/:id
- PUT /dishes/:id
- DELETE /dishes/:id

### Menus (6 endpoints)
- GET /menus
- POST /menus
- GET /menus/:id
- PUT /menus/:id
- PUT /menus/:id/dishes
- DELETE /menus/:id

### Quotations (6 endpoints)
- GET /quotations
- POST /quotations
- GET /quotations/:id
- PUT /quotations/:id
- PATCH /quotations/:id/status
- DELETE /quotations/:id

### Appointments (6 endpoints)
- GET /appointments
- POST /appointments
- GET /appointments/:id
- PUT /appointments/:id
- PATCH /appointments/:id/status
- DELETE /appointments/:id

### Scrapers (Deferred / Post‑MVP)
- Scraper endpoints are planned but not available in the current release.

### Public (9 endpoints)
- GET /public/chefs
- GET /public/chefs/:id
- GET /public/dishes
- GET /public/dishes/:id
- GET /public/menus
- GET /public/menus/:id
- GET /public/search
- GET /public/filters
- GET /public/statistics

### Admin (11 endpoints)
- GET /admin/dashboard
- GET /admin/chefs
- PATCH /admin/chefs/:id/status
- GET /admin/clients
- GET /admin/dishes
- GET /admin/menus
- GET /admin/quotations
- GET /admin/appointments
- GET /admin/audit-logs
- GET /admin/statistics
- GET /admin/users

---

## 🧪 Testing Strategy

### Quotations (protected)
- GET /quotations
- POST /quotations
- PUT /quotations/:id
- POST /quotations/:id/send (generate PDF + email)
- GET /quotations/:id/pdf

### Appointments (protected chef, public booking)
- GET /appointments
- POST /appointments
- PUT /appointments/:id
- PATCH /appointments/:id/status
- POST /appointments/calendly-webhook
- GET /appointments/availability

### Scraper (Deferred / Post‑MVP)
- Scraper endpoints are planned but not available in the current release.

### Public
- GET /public/chefs (landing)
- GET /public/chefs/:id (profile)
- POST /public/contact
- POST /public/appointments (public booking)

---

## 🔐 Security

### Authentication and Authorization
- **Passwords**: bcrypt (12 rounds)
- **JWT tokens**: HS256, 24h expiration
- **Refresh tokens**: 7 days (optional)
- **Middleware**: @jwt_required, @admin_required decorators
- **RBAC**: Role-based access control (CHEF, ADMIN)

### Validation and Sanitization
- **Input validation**: Marshmallow schemas
- **SQL injection**: SQLAlchemy ORM (prepared statements)
- **XSS protection**: Input sanitization
- **CSRF**: Token validation (for forms)

### Infrastructure
- **CORS**: flask-cors with domain whitelist
- **Rate limiting**: flask-limiter (optional)
- **File uploads**: Validate type/size with Cloudinary
- **HTTPS**: Required in production

---

## 🛒 Feature: Supermarket Scraper (Deferred / Post‑MVP)

**Supported supermarkets** (initially):
- Walmart (basic scraping)
- Optional: Amazon Fresh, local markets

**Flow**:
1. Chef adds ingredients to a dish
2. Scraper system searches prices in supermarkets (deferred)
3. Shows price comparison
4. Direct links to products

**Implementation**:
- BeautifulSoup4 for HTML parsing
- requests-html for JS rendering (optional)
- DB cache (24-48h) to avoid spam
- Request rate limiting
- User-Agent rotation to avoid blocking

## 📅 Feature: Appointment System

**Calendly API** ✅ (Selected)
- Easy integration
- Professional embed UI
- Time zone handling
- Automatic confirmations
- Free tier available
- Webhooks for synchronization

**Flow**:
1. Chef configures availability
2. Public client schedules session
3. Automatic confirmation via email
4. Bidirectional calendar sync

## 📊 Optional Improvements (Post-MVP)

- [ ] Dashboard analytics
- [ ] In-app notifications
- [ ] Multi-language (i18n)
- [ ] Dark mode
- [ ] PWA capabilities
- [ ] Export CSV/Excel
- [ ] Quotation templates
- [ ] Review system
- [ ] More supermarket scraping
- [ ] Automatic appointment reminders

---

## 🚀 Quick Commands

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py

# Frontend
cd frontend
# Open with Live Server or serve with:
python -m http.server 8080

# Database
psql -U postgres
CREATE DATABASE Savora;

# Initialize schemas and tables
cd backend
python scripts\init_db.py
```

---

## ⚠️ Technical Considerations

### Scraper (Deferred / Post‑MVP)
- **Legal**: Verify supermarket terms of service
- **Rate limiting**: Max 10 requests/min per supermarket
- **Cache**: 24-48h to reduce load
- **Fallback**: If scraper fails, show generic message
- **Async**: Use background jobs (Celery optional)

### Calendar
- **Calendly**: Requires account (free tier sufficient)
- **Google Calendar**: More complex OAuth2
- **Time zones**: Handle correctly (UTC + conversion)
- **Conflicts**: Validate availability before confirming

## 🧪 Testing Strategy

### Unit Tests (per layer)
```python
# test_user_repository.py
def test_get_by_email():
    user = user_repo.get_by_email("test@example.com")
    assert user.email == "test@example.com"

# test_auth_service.py
def test_register_user_success():
    user = auth_service.register_user("john", "john@example.com", "pass123")
    assert user.username == "john"

# test_auth_controller.py
def test_register_endpoint(client):
    response = client.post('/auth/register', json={...})
    assert response.status_code == 201
```

### Integration Tests
- Full endpoint tests (request → response)
- Business flow tests (create complete order)
- External integration tests (mocked)

### Coverage Targets
- **Repositories**: 90%+
- **Services**: 85%+
- **Controllers**: 80%+
- **Overall**: 80%+

---

## 🚀 Implemented Best Practices

### Dependency Injection
```python
# Services receive dependencies in __init__
class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

# In controller
auth_service = AuthService(UserRepository())
```

### Centralized Error Handling
```python
# app/core/lib/error_utils.py
def error_response(message, status_code):
    return jsonify({"error": message}), status_code

# In controller
try:
    user = auth_service.register_user(...)
except ValueError as e:
    return error_response(str(e), 400)
```

### Consistent Logging
```python
from config.logging import get_logger
logger = get_logger(__name__)

logger.info(f"User {user.username} registered successfully")
logger.error(f"Failed to create user: {e}", exc_info=True)
```

### Cache Management (optional)
```python
from app.core.cache_manager import get_cache

cache = get_cache()
cache.store_data("product:123", product_data, ttl=3600)
```

---

## 🧪 Testing Strategy

### Unit Tests (✅ 93 tests - 100% passing)

**Coverage by Module:**
- Auth: 16 tests
- Appointments: 12 tests  
- Chefs: 3 tests
- Clients: 8 tests
- Dishes: 10 tests
- Menus: 9 tests
- Quotations: 6 tests (1 skipped - backend bug)
- Scrapers: Deferred (Post‑MVP)
- Public: 15 tests

**Test Structure:**
```
tests/
├── conftest.py          # Shared fixtures (app, db, auth)
├── setup_test_db.py     # PostgreSQL test DB setup
├── TESTING_GUIDE.md     # Complete testing documentation
├── unit/
│   ├── README.md
│   ├── test_*.py        # 10 test modules
│   └── test_helpers.py  # Validation utilities
└── integration/
    └── README.md        # Pending Phase 7
```

**Run Tests:**
```bash
# All unit tests
pytest tests/unit/ -v

# Specific module
pytest tests/unit/test_auth.py -v

# With coverage
pytest tests/unit/ --cov=app --cov-report=html
```

### Integration Tests (⏳ Pending Phase 7)

**Planned:**
- End-to-end business flows
- External service integration (Cloudinary, Mailtrap)
- Cross-module operations
- Performance tests

---

## 📝 Current Status & Next Steps

### ✅ Completed (Backend)
1. ✅ PostgreSQL multi-schema database (11 tables)
2. ✅ Complete 3-tier architecture implementation
3. ✅ All 10 modules with CRUD operations (including Admin)
4. ✅ JWT authentication system with role-based access
5. ✅ **497 tests** (358 unit + 139 integration) - 85% unit-test coverage
6. ✅ API documentation (60 endpoints)
7. ✅ Full integration validation (10/10 modules)

### 🔄 In Progress
1. **Frontend Development**: 
   - Login/Register pages
   - Dashboard pages (clients, dishes, menus, quotations)
   - Public pages (landing, chef profiles)

2. **External Integrations**:
    - PDF generation (WeasyPrint) ✅
    - Email sending (SMTP / Mailtrap) ✅
    - Calendar export (.ics) ✅

### ⏳ Pending (Phase 7)
1. Integration tests
2. Error handling refinement
3. UI/UX polish
4. Deployment preparation

---

## 📚 Documentation

- **[Documentation Hub](../INDEX.md)**: Central navigation for all docs
- **[API Documentation](./API_DOCUMENTATION.md)**: Complete endpoint documentation
- **[Testing Guide](./TESTING_GUIDE.md)**: How to run unit + integration tests
- **[Cache Guide](./CACHE_GUIDE.md)**: Redis cache system
- **[Admin Design](./ADMIN_DESIGN.md)**: Admin module architecture
- **Schema & Migrations**: Alembic (`backend/alembic/`) + historical notes in `docs/archive/SCHEMA_MIGRATION_HISTORY.md`

---

## 🎯 Roadmap Summary

| Phase | Status | Backend | Frontend | Tests |
|-------|--------|---------|----------|-------|
| 1: Foundation | ✅ Complete | ✅ Auth | ⏳ Pending | ✅ 16 tests |
| 2: Base Management | ✅ Complete | ✅ Clients, Dishes | ⏳ Pending | ✅ 18 tests |
| 3: Menus | ✅ Complete | ✅ CRUD | ⏳ Pending | ✅ 9 tests |
| 4: Quotations | 🔄 Backend Done | ✅ CRUD | ⏳ Pending | ✅ 6 tests |
| 5: Advanced | 🔄 Backend In Progress | ⏳ Scrapers (Deferred), ✅ Appointments | ⏳ Pending | ✅ 26 tests |
| 6: Public | ✅ Backend Done | ✅ Public API | ⏳ Pending | ✅ 15 tests |
| 7: Polish | ⏳ Pending | ⏳ Integration | ⏳ Full impl | ⏳ Integration tests |

---

## 📞 Quick Commands

### 3. Frontend Base
- [ ] Login page (HTML + CSS)
- [ ] Register page
- [ ] JWT token handling in LocalStorage
- [ ] Axios config with interceptors

**🎯 Immediate Goal: Complete functional authentication (register + login) in 2-3 days**

---

## 🔒 Production Security Strategy

### Admin Account Management

#### Development Environment
- Use `seed_admin.py` script with `.env` credentials
- Default credentials acceptable for local testing
- Focus on rapid development iteration

#### Staging Environment
- Run seed script **once** during initial setup
- Immediately change password after first login
- Add second admin account as backup
- Test credential recovery procedures

#### Production Environment
**Initial Setup:**
1. Run seed script with strong credentials
2. Store credentials in secure vault (LastPass, 1Password, etc.)
3. Change password immediately after first login
4. Create 2-3 additional admin accounts
5. **Delete seed script from production server**

**Required Security Features:**
- ✅ Public registration creates only CHEF users (role parameter ignored)
- ⏳ Email-based password recovery system
- ⏳ Recovery codes (backup 2FA codes)
- ⏳ Admin-only endpoint to create additional admins
- ⏳ Multi-factor authentication (MFA) for admin accounts
- ⏳ Audit logging for all admin actions

### Credential Recovery Chain

**Priority order when admin credentials are lost:**

1. **Email Recovery** (Primary)
   - POST /auth/forgot-password endpoint
   - Time-limited reset token (15-30 minutes)
    - Secure email delivery via SMTP (Mailtrap for dev/testing)
   - Rate limiting to prevent abuse

2. **Recovery Codes** (Backup)
   - One-time use backup codes
   - Generated during admin creation
   - Stored securely by admin (printed/vault)
   - Can bypass email requirement

3. **Another Admin** (Fallback)
   - Multiple admin accounts reduce single point of failure
   - Admins can reset each other's passwords
   - Requires admin-only password reset endpoint

4. **Database Access** (Last Resort)
   - Direct database manipulation
   - Hash new password manually
   - Requires infrastructure access (DevOps/DB admin)
   - Should be documented but rarely used

### Attack Prevention Measures

**Currently Implemented:**
- ✅ Role parameter ignored in public registration
- ✅ Role hardcoded to CHEF in `auth_service.py`
- ✅ Seed script uses environment variables

**Production Requirements:**
- ⏳ Remove seed script from production deployment
- ⏳ MFA for all admin accounts
- ⏳ IP whitelisting for admin endpoints (optional)
- ⏳ Rate limiting on all auth endpoints
- ⏳ Audit logs for admin actions (who, what, when, IP)
- ⏳ Failed login attempt monitoring
- ⏳ Automated alerts for suspicious admin activity

### Industry Standards Reference

**Patterns researched:**
- **Django**: `createsuperuser` CLI command (server access required)
- **Rails**: `rails console` for admin creation (server access required)
- **WordPress**: Database manipulation for password reset
- **Auth0**: Invitation-based admin onboarding
- **AWS IAM**: Multiple admin users, MFA enforced, recovery via root account
- **GitHub**: MFA required, recovery codes, SMS backup

**OWASP/NIST Guidelines:**
- Never expose admin creation in public APIs
- Enforce MFA for privileged accounts
- Implement comprehensive audit logging
- Use time-limited recovery tokens
- Rate limit authentication attempts

### Production Deployment Phases

#### Phase 1: Development (Current State)
- [x] Seed script functional
- [x] Role parameter ignored in public registration
- [x] Basic security documentation
- [x] All auth endpoints tested

#### Phase 2: Staging Preparation
- [ ] Implement email recovery system
- [ ] Implement recovery codes
- [ ] Add admin-only user creation endpoint
- [ ] Add comprehensive audit logging
- [ ] Test credential recovery procedures

#### Phase 3: Production Hardening
- [ ] Remove seed script from deployment
- [ ] Enforce MFA for admin accounts
- [ ] Set up monitoring and alerts
- [ ] Create incident response playbook
- [ ] Train team on credential recovery procedures
- [ ] Store admin credentials in secure vault
- [ ] Create multiple admin accounts

#### Phase 4: Ongoing Operations
- [ ] Regular security audits
- [ ] Quarterly admin credential rotation
- [ ] Review audit logs for suspicious activity
- [ ] Update recovery procedures as needed
- [ ] Test disaster recovery scenarios

**📌 Note**: Production security features should be implemented AFTER core functionality is complete and tested in staging environment.

