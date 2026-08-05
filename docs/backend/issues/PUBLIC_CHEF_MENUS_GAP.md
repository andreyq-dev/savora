# Public Chef Menus Gap (Design + Business)

**Date:** 2026-02-08

## Problem
The public chef profile allows visitors to contact a chef but does not visually surface the chef’s published menus. This reduces conversion because users cannot see the chef’s offerings before reaching out.

**User context:**
- The landing page highlights featured menus and offers a “View Chef” CTA.
- That CTA currently sends users to the public chefs list, then to a chef profile.
- On the chef profile, users can only see contact form + basic bio, but **no visual menus**.
- This creates a business/UX gap: users don’t see what the chef offers, so they’re less likely to engage.

## Backend Requirements (Assigned to Backend Agent)
1. **Ensure public chef profile includes menus with dish previews**
   - Endpoint: `GET /public/chefs/{id}`
   - Response should include:
     - `menus[]` with `id`, `name`, `description`, `dish_count`, `total_price`
     - `menus[].dishes[]` with `dish.name` and `dish.photo_url` (for card images)
   - If this data is already present, **confirm it is populated** (not empty due to lazy loading or missing joins).

2. **Performance + consistency**
   - Use eager loading for menu dishes to avoid N+1 queries (e.g., `joinedload(Menu.menu_dishes).joinedload(MenuDish.dish)` in `PublicRepository.get_chef_menus`).
   - Keep filtering to **published** menus only.
   - Maintain cache invalidation rules for public profile when menus or dishes change.

3. **Optional (if needed for pagination / scaling)**
   - Add `GET /public/chefs/{id}/menus` with pagination (`page`, `per_page`) returning the same menu summary fields.

## Frontend Requirements (Implemented Here)
- Add a **Menus Destacados** section to the public chef profile.
- Render menu cards with image, description, total price, and dish count.
- Provide a CTA to contact the chef (`#contact-section`).
- Display an empty state when no menus are published.
- Show summary stats for menus + dishes.

## Acceptance Criteria
- On a chef profile, users can visually browse that chef’s published menus.
- Menu cards display dish imagery when available; fallback images otherwise.
- No regression in contact flow.

---

## Prompt for Backend Agent
Necesitamos cerrar un gap de UX y negocio. Flujo actual:
- Home (landing) muestra menús destacados con CTA “View Chef”.
- Ese CTA lleva a listado de chefs y luego a perfil público del chef.
- En el perfil público hoy solo hay bio + formulario de contacto, **sin menús visibles**.

**Impacto:** el usuario no ve la oferta del chef (menús, estilo, fotos), lo que baja conversión y reduce intención de contacto.

**Objetivo:** el endpoint público de perfil debe entregar menús publicados con datos suficientes para cards visuales, y deben estar poblados (no vacíos por lazy loading).

**Tareas backend (prioridad):**
1) Asegura que `GET /public/chefs/{id}` incluya menús publicados del chef con datos suficientes para cards:
   - `menus[]`: `id`, `name`, `description`, `dish_count`, `total_price`.
   - `menus[].dishes[]`: `dish.name`, `dish.photo_url` (para imagen en card).
   - Verifica que la lista no llegue vacía por lazy loading/missing joins.
2) Performance: eager loading para `menu_dishes` y `dish` (evitar N+1) en `PublicRepository.get_chef_menus`.
3) Mantener filtro solo **publicados** y cache invalidation existente.

**Opcional si se necesita escalar/paginar:**
4) Nuevo endpoint `GET /public/chefs/{id}/menus?page=&per_page=` con los mismos campos (mantener consistencia con schema actual).

**Criterios de aceptación backend:**
- Llamar a `/public/chefs/{id}` retorna menús con al menos 1 dish y photo_url si existe.
- No se rompe el contrato de respuesta actual (se añaden datos, no se eliminan).

**Archivos clave:**
- `backend/app/public/repositories/public_repository.py`
- `backend/app/public/services/public_service.py`
- `backend/app/public/controllers/public_controller.py`
- `backend/app/public/routes/public_routes.py`
- `backend/app/menus/schemas/menu_schema.py`
