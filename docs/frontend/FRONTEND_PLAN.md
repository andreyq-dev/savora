# Savora Frontend Development Plan

**Last Updated**: January 2, 2026  
**Status**: Planning Phase  
**Tech Stack**: Vanilla JavaScript (ES6 Modules) + CSS + Vite

---

## 📋 Table of Contents

1. [Tech Stack & Tools](#tech-stack--tools)
2. [Project Structure](#project-structure)
3. [Development Phases](#development-phases)
4. [Page-by-Page Breakdown](#page-by-page-breakdown)
5. [Reusable Components](#reusable-components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Testing Strategy](#testing-strategy)

---

## 🛠️ Tech Stack & Tools

### Core Technologies
- **JavaScript**: ES6+ (Classes, Modules, Async/Await)
- **CSS**: Custom CSS with CSS Variables
- **HTML5**: Semantic HTML
- **Build Tool**: Vite (dev server + bundling)
- **HTTP Client**: Axios (for API calls)

### Development Tools
- **Package Manager**: pnpm (already in use)
- **Linter**: ESLint (to be configured)
- **Formatter**: Prettier (to be configured)
- **Browser DevTools**: Chrome/Firefox DevTools

### Optional Libraries (to be evaluated)
- **Date Picker**: Flatpickr or native `<input type="date">`
- **Charts**: Chart.js (for analytics dashboard)
- **Icons**: Font Awesome or Heroicons
- **Notifications**: Custom toast system

---

## 📁 Project Structure

```
frontend/
├── index.html                           # Public landing page
├── package.json                         # Dependencies (axios, vite)
├── vite.config.js                       # Vite configuration
├── .eslintrc.js                         # Linting rules
│
├── pages/                               # HTML pages
│   ├── auth/
│   │   ├── login.html                   # Login page
│   │   └── register.html                # Registration page
│   ├── dashboard/
│   │   ├── overview.html                # Dashboard home
│   │   ├── clients.html                 # Client management
│   │   ├── dishes.html                  # Dish catalog
│   │   ├── menus.html                   # Menu builder
│   │   ├── quotations.html              # Quotation management
│   │   ├── appointments.html            # Calendar view
│   │   └── (deferred) Scraper module    # Post-MVP
│   └── public/
│       ├── chefs.html                   # Public chef list
│       └── chef-profile.html            # Public chef profile
│
├── scripts/                             # JavaScript modules
│   ├── core/
│   │   ├── app.js                       # App initialization
│   │   ├── config.js                    # Configuration (API_BASE, etc.)
│   │   ├── router.js                    # Client-side routing (optional)
│   │   ├── state.js                     # Global state manager (auth, user)
│   │   └── utils.js                     # Helper functions
│   │
│   ├── services/                        # API communication layer
│   │   ├── apiClient.js                 # Axios wrapper with interceptors
│   │   ├── authService.js               # Login, register, logout
│   │   ├── clientService.js             # Client CRUD
│   │   ├── dishService.js               # Dish CRUD
│   │   ├── menuService.js               # Menu CRUD + dish assignment
│   │   ├── quotationService.js          # Quotation CRUD + PDF generation
│   │   ├── appointmentService.js        # Appointment CRUD
│   │   └── (deferred) Scraper service   # Post-MVP
│   │
│   ├── components/                      # Reusable UI components
│   │   ├── Modal.js                     # Generic modal dialog
│   │   ├── LoadingSpinner.js            # Loading indicator
│   │   ├── ErrorMessage.js              # Error display
│   │   ├── Toast.js                     # Toast notifications
│   │   ├── Pagination.js                # Pagination controls
│   │   ├── DishCard.js                  # Dish display card
│   │   ├── ClientCard.js                # Client display card
│   │   ├── MenuCard.js                  # Menu display card
│   │   └── ConfirmDialog.js             # Confirmation dialog
│   │
│   └── views/                           # Page-specific logic
│       ├── clientsView.js               # Clients page logic
│       ├── dishesView.js                # Dishes page logic
│       ├── menusView.js                 # Menus page logic
│       ├── quotationsView.js            # Quotations page logic
│       ├── appointmentsView.js          # Appointments page logic
│       └── (deferred) Scraper view      # Post-MVP
│
└── styles/                              # CSS files
    ├── main.css                         # Global styles + CSS variables
    ├── components.css                   # Component styles
    ├── layout.css                       # Layout utilities (grid, flex)
    └── pages/
        ├── auth.css                     # Auth pages
        ├── dashboard.css                # Dashboard layout
        ├── clients.css                  # Clients page
        ├── dishes.css                   # Dishes page
        ├── menus.css                    # Menus page
        └── public.css                   # Public pages
```

---

## 🚀 Development Phases

### Phase 0: Foundation (2-3 days)
**Goal**: Setup development environment and base architecture

**Tasks**:
- [x] Configure Vite for dev server
- [ ] Setup ESLint + Prettier
- [ ] Create CSS design tokens (colors, fonts, spacing)
- [ ] Implement base layout (navbar, sidebar, footer)
- [ ] Create AppState class for global state
- [ ] Setup axios interceptors for JWT injection
- [ ] Create base HTML templates (dashboard layout)

**Deliverable**: Development environment ready, base layout works

---

### Phase 1: Authentication (2 days)
**Goal**: User can register, login, and logout

**Pages**: 
- `login.html`
- `register.html`

**Features**:
- Login form with email validation
- Register form (public registration creates chef users)
- JWT token storage in localStorage
- Auto-redirect to dashboard if already logged in
- Error message display

**API Endpoints Used**:
- `POST /auth/register`
- `POST /auth/login`

**Success Criteria**:
- User can register and immediately login
- Token is stored and used for protected routes
- Invalid credentials show error message

---

### Phase 2: Dashboard Core (5-7 days)
**Goal**: CRUD operations for main entities

#### 2.1 Clients Page (2 days)
**File**: `pages/dashboard/clients.html`

**Features**:
- Table view with columns: Name, Email, Phone, Dietary Restrictions
- Search bar (filter by name/email)
- "Add Client" button → modal form
- Edit/Delete actions per row
- Pagination (20 clients per page)

**Components Used**:
- `Modal.js` (for add/edit form)
- `Pagination.js`
- `ConfirmDialog.js` (for delete confirmation)

**API Endpoints**:
- `GET /clients?page=1&per_page=20&search=...`
- `POST /clients`
- `PUT /clients/:id`
- `DELETE /clients/:id`

**Data Flow**:
1. Page loads → `clientsView.js` calls `clientService.getAll()`
2. User clicks "Add" → Modal opens with form
3. User submits → `clientService.create()` → refresh table

---

#### 2.2 Dishes Page (3 days)
**File**: `pages/dashboard/dishes.html`

**Features**:
- Card grid layout (3-4 cards per row)
- Each card shows: Image, Name, Price, Category, Active/Inactive badge
- Filters: Category dropdown, Active/Inactive toggle, Search bar
- "Add Dish" button → form page or modal
- Edit/Delete actions per card

**Components Used**:
- `DishCard.js`
- `Modal.js` (for add/edit form with image upload)
- `LoadingSpinner.js`

**Form Fields**:
- Name (text)
- Description (textarea)
- Price (number)
- Category (select: Appetizer, Main Course, Dessert, Beverage)
- Ingredients (textarea or multi-input)
- Image URL (text input or file upload)
- Is Active (checkbox)

**API Endpoints**:
- `GET /dishes?category=...&is_active=true`
- `POST /dishes`
- `PUT /dishes/:id`
- `DELETE /dishes/:id`

**Image Upload Strategy**:
- **Option A**: Direct URL input (simple, no upload needed)
- **Option B**: File upload → convert to Base64 → send to backend
- **Option C**: Use Cloudinary widget (best, requires Cloudinary account)

**Success Criteria**:
- Can add dish with all fields
- Image displays correctly
- Filters work instantly
- Can toggle active/inactive status

---

#### 2.3 Menus Page (2 days)
**File**: `pages/dashboard/menus.html`

**Features**:
- List view with cards: Menu Name, Status, Number of Dishes, Total Price
- "Create Menu" button → multi-step form
- Edit/Delete actions
- Status badges (Draft, Published, Archived, Seasonal)

**Menu Creation Flow**:
1. **Step 1**: Basic info (Name, Description, Menu Type)
2. **Step 2**: Select dishes (multi-select from available dishes)
3. **Step 3**: Preview menu with total price
4. **Step 4**: Save as draft or publish

**Components Used**:
- `MenuCard.js`
- `Modal.js` (for multi-step form)
- `DishCard.js` (for dish selection)

**API Endpoints**:
- `GET /menus?status=published`
- `POST /menus`
- `PUT /menus/:id`
- `PUT /menus/:id/dishes` (assign dishes to menu)
- `DELETE /menus/:id`

**Success Criteria**:
- Can create menu and assign dishes
- Total price calculates automatically
- Can change menu status (draft → published)

---

### Phase 3: Advanced Features (5-7 days)

#### 3.1 Quotations Page (3 days)
**File**: `pages/dashboard/quotations.html`

**Features**:
- List view: Quotation #, Client Name, Event Date, Total, Status
- "Create Quotation" button → form
- View/Edit/Delete/Send actions
- PDF generation button
- Status workflow: Draft → Sent → Accepted/Rejected

**Quotation Form**:
- Select client (dropdown)
- Select menu (dropdown)
- Event date (date picker)
- Number of guests (number)
- Additional items (dynamic add/remove)
- Custom discount (percentage or fixed)
- Notes (textarea)

**Components Used**:
- `Modal.js`
- Date picker library (Flatpickr)

**API Endpoints**:
- `GET /quotations?status=draft`
- `POST /quotations`
- `PUT /quotations/:id`
- `GET /quotations/:id/pdf` (download PDF)
- `POST /quotations/:id/send` (send via email)

**Success Criteria**:
- Can create quotation with menu + custom items
- PDF generates and downloads
- Can send quotation via email (backend handles email)

---

#### 3.2 Appointments Page (2 days)
**File**: `pages/dashboard/appointments.html`

**Features**:
- Calendar view (month/week/day)
- List view (alternative)
- "New Appointment" button → form
- Click appointment → view details
- Color-coded by status (Scheduled, Completed, Cancelled)

**Appointment Form**:
- Client (dropdown)
- Date & Time (datetime picker)
- Duration (number in hours)
- Type (dropdown: Consultation, Event, Tasting)
- Notes (textarea)

**Components Used**:
- Calendar library (FullCalendar.js or custom implementation)
- `Modal.js`

**API Endpoints**:
- `GET /appointments?start_date=...&end_date=...`
- `POST /appointments`
- `PUT /appointments/:id`
- `DELETE /appointments/:id`

**Success Criteria**:
- Appointments display on calendar
- Can create, edit, cancel appointments
- Calendar navigation works (prev/next month)

---

#### 3.3 Scraper Page (Deferred)
**Status**: Post-MVP feature. The scraper UI and workflow are deferred for a future release.

---

### Phase 4: Public Pages (3-5 days)

#### 4.1 Landing Page (2 days)
**File**: `index.html`

**Sections**:
1. **Hero**: "Find Your Perfect Chef" + search bar
2. **How It Works**: 3-step process (Find Chef → Get Quote → Enjoy Event)
3. **Featured Chefs**: Carousel of 6 chefs
4. **Call to Action**: "Sign Up as a Chef" button

**Features**:
- Search bar for chef name/specialty/location
- Responsive design (mobile-first)
- Smooth scroll animations

**API Endpoints**:
- `GET /public/chefs?search=...&specialty=...&location=...`

---

#### 4.2 Public Chef Profile (2 days)
**File**: `pages/public/chef-profile.html`

**URL Pattern**: `/pages/public/chef-profile.html?id=123`

**Sections**:
1. **Header**: Chef photo, name, specialty, location, rating
2. **Bio**: Description, years of experience
3. **Sample Dishes**: Grid of 6-8 dishes with images
4. **Sample Menus**: List of 3-4 menus
5. **Contact Form**: Name, email, message, preferred date

**API Endpoints**:
- `GET /public/chefs/:id`
- `GET /public/chefs/:id/dishes`
- `GET /public/chefs/:id/menus`
- `POST /public/contact` (send inquiry)

**Success Criteria**:
- Profile loads dynamically from URL parameter
- Contact form submits and shows success message
- Images load properly

---

### Phase 5: Polish & Optimization (2-3 days)

**Tasks**:
- [ ] Mobile responsiveness testing (all pages)
- [ ] Add loading states to all API calls
- [ ] Implement toast notifications for success/error
- [ ] Add form validation (client-side)
- [ ] Optimize images (lazy loading, compression)
- [ ] Add keyboard shortcuts (Esc to close modals, etc.)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Add basic SEO (meta tags, Open Graph)

---

## 🧩 Reusable Components

### 1. Modal (`scripts/components/Modal.js`)
Generic modal for forms and content display.

**API**:
```javascript
const modal = new Modal({
  title: 'Add New Dish',
  content: formHTML,
  onClose: () => { /* cleanup */ }
});
modal.open();
modal.close();
```

---

### 2. LoadingSpinner (`scripts/components/LoadingSpinner.js`)
Show/hide loading indicator.

**API**:
```javascript
const spinner = new LoadingSpinner(containerElement);
spinner.show();
spinner.hide();
```

---

### 3. Toast (`scripts/components/Toast.js`)
Non-blocking notifications.

**API**:
```javascript
Toast.success('Client added successfully!');
Toast.error('Failed to save dish.');
Toast.info('Quotation sent to client.');
```

---

### 4. Pagination (`scripts/components/Pagination.js`)
Pagination controls with page numbers and prev/next.

**API**:
```javascript
const pagination = new Pagination({
  totalItems: 150,
  itemsPerPage: 20,
  currentPage: 1,
  onChange: (page) => { /* load new page */ }
});
```

---

### 5. ConfirmDialog (`scripts/components/ConfirmDialog.js`)
Confirmation dialog for destructive actions.

**API**:
```javascript
ConfirmDialog.show({
  message: 'Are you sure you want to delete this client?',
  onConfirm: () => { /* delete client */ },
  onCancel: () => { /* do nothing */ }
});
```

---

## 🔄 State Management

### AppState Class (`scripts/core/state.js`)

**Responsibilities**:
- Store current user info (id, email, role)
- Store JWT token
- Manage authentication state
- Notify listeners on state changes

**Usage**:
```javascript
import { appState } from './core/state.js';

// Check if user is logged in
if (!appState.isAuthenticated()) {
  window.location.href = '/pages/auth/login.html';
}

// Get current user
const user = appState.getUser();
console.log(`Welcome, ${user.email}`);

// Subscribe to auth changes
appState.subscribe((user) => {
  console.log('User changed:', user);
});

// Logout
appState.logout(); // Clears token, redirects to login
```

---

## 🌐 API Integration

### API Client (`scripts/services/apiClient.js`)

**Features**:
- Axios wrapper with base URL
- Request interceptor (auto-add JWT token)
- Response interceptor (handle 401, refresh token logic)
- Error formatting

**Example**:
```javascript
import apiClient from './apiClient.js';

// GET request
const dishes = await apiClient.get('/dishes');

// POST request
const newDish = await apiClient.post('/dishes', {
  name: 'Caesar Salad',
  price: 12.99
});

// Handles errors automatically (shows toast, logs to console)
```

---

## 🧪 Testing Strategy

### Manual Testing (Initial Phase)
- Test each page after implementation
- Check all CRUD operations
- Validate form inputs
- Test responsive design on different screen sizes

### Automated Testing (Future)
- **Unit Tests**: Jest for JavaScript functions
- **E2E Tests**: Playwright or Cypress for user flows
- **Visual Regression**: Percy or Chromatic for UI changes

---

## 📊 Progress Tracking

| Phase | Status | Completion % | Notes |
|-------|--------|--------------|-------|
| Phase 0: Foundation | 🟢 Completed | 100% | Vite, CSS tokens, apiClient, auth guard, AppState |
| Phase 1: Authentication | 🟢 Completed | 100% | login.js, register.js, onboarding.js, auth guard |
| Phase 2: Dashboard Core | 🟢 Completed | 100% | clients, dishes (+ category/prep_time/servings), menus — CRUD completo |
| Phase 3: Advanced Features | 🟢 Completed | 100% | quotations, appointments, PDF download, envío de email |
| Phase 4: Public Pages | 🟢 Completed | 100% | landing page, listado de chefs, perfil público, formulario de contacto |
| Phase 5: Polish | 🟡 In Progress | 70% | Validación manual QA pendiente (ver FRONTEND_VALIDATION_STATUS.md) |

**Legend**: 🔴 Not Started | 🟡 In Progress | 🟢 Completed

---

## 📝 Next Steps

1. **Review this plan** with the team/stakeholders
2. **Fill out page specifications** using `PAGE_SPECIFICATION_TEMPLATE.md`
3. **Create wireframes** for each page (see tool recommendations)
4. **Start Phase 0**: Setup Vite, create design tokens, build base layout
5. **Iterate**: Build one page at a time, test thoroughly

---

**Questions? Feedback?**  
Update this document as the project evolves. This is a living document.
