# Frontend Validation Status (Manual QA Checklist)

**Date:** 2026-02-01

> This document is a **manual validation checklist**. Per request, **every page should be re-validated from your side**, even if previously reviewed.

## Global Validation (all pages)
- [ ] Layout and spacing (desktop + mobile)
- [ ] Navigation links (top nav + sidebar)
- [ ] Error states (API failures)
- [ ] Empty states (no data)
- [ ] Loading states
- [ ] Auth guard behavior (redirect to login if needed)
- [ ] Theme consistency (Monks styling)
- [ ] Scroll reveal animations (public pages)

---

## Public / Marketing

### Home
- [ ] [frontend/index.html](../../frontend/index.html)
  - [ ] Hero layout and CTA
  - [ ] Logo rendering and sizing
  - [ ] Featured menus load from /public/menus
  - [ ] Sections and scroll reveals

### Public Chefs Listing
- [ ] [frontend/pages/public/chefs.html](../../frontend/pages/public/chefs.html)
  - [ ] Filters load from /public/filters
  - [ ] /public/chefs results list
  - [ ] Empty state copy
  - [ ] “View profile” link
  - [ ] “Request quote” link

### Public Chef Profile
- [ ] [frontend/pages/public/chef-profile.html](../../frontend/pages/public/chef-profile.html)
  - [ ] /public/chefs/{id} load
  - [ ] Menús publicados del chef (cards + CTA)
  - [ ] Estado vacío cuando no hay menús
  - [ ] Resumen de stats (menús + platos)
  - [ ] Contact form → /public/contact
  - [ ] Form validation + success/error

---

## Auth

### Login
- [ ] [frontend/pages/auth/login.html](../../frontend/pages/auth/login.html)
  - [ ] Submit login / auth flow
  - [ ] Redirect to dashboard
  - [ ] Error messaging

### Register
- [ ] [frontend/pages/auth/register.html](../../frontend/pages/auth/register.html)
  - [ ] Submit register / auth flow
  - [ ] Redirect to dashboard
  - [ ] Error messaging

---

## Chef Onboarding

### Chef Onboarding
- [ ] [frontend/pages/chef/onboarding.html](../../frontend/pages/chef/onboarding.html)
  - [ ] Form submission
  - [ ] Expected redirect/next step
  - [ ] Error handling

---

## Dashboard

### Dashboard Landing
- [ ] [frontend/pages/dashboard/index.html](../../frontend/pages/dashboard/index.html)
  - [ ] Sidebar navigation
  - [ ] Topbar user menu

### Dashboard Overview
- [ ] [frontend/pages/dashboard/overview.html](../../frontend/pages/dashboard/overview.html)
  - [ ] Stats placeholders (if wired)
  - [ ] Sidebar navigation

### Clients
- [ ] [frontend/pages/dashboard/clients.html](../../frontend/pages/dashboard/clients.html)
  - [ ] GET /clients list
  - [ ] Create client modal
  - [ ] Edit client modal
  - [ ] Delete client

### Dishes
- [ ] [frontend/pages/dashboard/dishes.html](../../frontend/pages/dashboard/dishes.html)
  - [ ] GET /dishes list
  - [ ] Create dish (Cloudinary upload)
  - [ ] Edit dish modal
  - [ ] Delete dish

### Menus
- [ ] [frontend/pages/dashboard/menus.html](../../frontend/pages/dashboard/menus.html)
  - [ ] GET /menus list
  - [ ] Create menu + dish selection
  - [ ] Edit menu modal
  - [ ] Manage dishes modal
  - [ ] Delete menu

### Quotations
- [ ] [frontend/pages/dashboard/quotations.html](../../frontend/pages/dashboard/quotations.html)
  - [ ] GET /quotations list
  - [ ] Status filter tabs
  - [ ] Create quotation modal

### Quotation Detail
- [ ] [frontend/pages/dashboard/quotation-detail.html](../../frontend/pages/dashboard/quotation-detail.html)
  - [ ] GET /quotations/{id}
  - [ ] Items and pricing display
  - [ ] Status updates

### Appointments
- [ ] [frontend/pages/dashboard/appointments.html](../../frontend/pages/dashboard/appointments.html)
  - [ ] GET /appointments (filters)
  - [ ] Create appointment
  - [ ] Edit appointment
  - [ ] Status update (PATCH)
  - [ ] Delete appointment

### Deferred Features (Post-MVP)
- [ ] Scraper module (sources, scraping, compare, cleanup) — deferred for a future release.

---

## Validation Summary
- [ ] **Re-validate all pages** listed above.
- [ ] Capture any inconsistencies and report back for fixes.
