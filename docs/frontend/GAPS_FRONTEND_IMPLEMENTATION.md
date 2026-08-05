# Frontend Gaps Implementation Status

**Last Updated:** April 2026  
**Status:** All critical gaps from ADR-003 have been resolved.

---

## Summary

| Gap | Description | Status | Implementation |
|-----|-------------|--------|----------------|
| GAP-1 | Envío de cotización por email | ✅ Resuelto | `POST /quotations/:id/send` + modal en `quotation-detail.js` |
| GAP-2 | Formulario de contacto público | ✅ Resuelto | `POST /public/contact` + form en `public-chef-profile.js` |
| GAP-3 | Onboarding de perfil chef | ✅ Resuelto | `pages/chef/onboarding.html` + redirect en `auth-guard.js` |

---

## GAP-1: Envío de Cotización por Email — RESUELTO

**Descripción original:** Las cotizaciones debían poder enviarse por correo electrónico al cliente en formato PDF.

### Backend
- **Endpoint:** `POST /quotations/:id/send`
- **Controlador:** `backend/app/quotations/controllers/quotation_controller.py` — método `send_quotation_email()`
- **Servicio:** `backend/app/quotations/services/quotation_service.py` — método `send_quotation_email()`
- **Email service:** `backend/app/core/services/email_service.py` — Mailtrap SMTP
- **Template:** `backend/app/core/templates/quotation_email.html`
- **Schema de validación:** `QuotationSendSchema` en `backend/app/quotations/schemas/quotation_schema.py`

### Frontend
- **Modal de envío:** `frontend/scripts/views/quotation-detail.js` — función `initSendEmailModal()` (líneas 167–268)
- **Página:** `frontend/pages/dashboard/quotation-detail.html`
- **Flujo:** Ver detalle de cotización → botón "Enviar por Email" → modal con email del cliente pre-llenado → confirmar → PDF adjunto enviado vía SMTP

### Configuración requerida
```env
EMAIL_ENABLED=true
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USERNAME=<tu-usuario>
MAILTRAP_PASSWORD=<tu-password>
MAILTRAP_FROM_EMAIL=notifications@savora.com
MAILTRAP_FROM_NAME=Savora
```

---

## GAP-2: Formulario de Contacto Público — RESUELTO

**Descripción original:** Los usuarios externos debían poder contactar a los chefs desde la landing page y el perfil público.

### Backend
- **Endpoint:** `POST /public/contact` (sin autenticación requerida)
- **Controlador:** `backend/app/public/controllers/public_controller.py` — método `submit_contact_form()`
- **Servicio:** `backend/app/public/services/public_service.py` — método `submit_contact_form()`
- **Schema de validación:** `backend/app/public/schemas/contact_schema.py` — `ContactFormSchema`
- **Template:** `backend/app/core/templates/contact_notification.html`
- **Notificación:** Email automático al chef cuando recibe un mensaje

### Frontend
- **Formulario:** `frontend/pages/public/chef-profile.html` — sección `#contact-section`
- **Lógica:** `frontend/scripts/views/public-chef-profile.js` — función `initContactForm()` (líneas 216–320)
- **Campos:** nombre, email, teléfono (opcional), mensaje (mínimo 10, máximo 2000 caracteres)
- **Respuesta:** Mensaje de éxito al usuario; notificación al chef por email

---

## GAP-3: Onboarding de Perfil Chef — RESUELTO

**Descripción original:** Un chef recién registrado debía ser guiado a crear su perfil antes de usar la plataforma.

### Backend
- **Endpoint:** `POST /chefs/profile` y `GET /chefs/profile`
- **Validación:** Retorna 404 si el chef no tiene perfil creado aún

### Frontend
- **Página de onboarding:** `frontend/pages/chef/onboarding.html`
- **Lógica:** `frontend/scripts/views/onboarding.js`
  - Verifica si ya existe perfil (si sí, redirige al dashboard)
  - Formulario con bio, especialidad, ubicación, teléfono
  - POST a `/chefs/profile` → redirige al dashboard en éxito
- **Auth guard:** `frontend/scripts/core/auth-guard.js`
  - En cada página protegida, verifica `GET /chefs/profile`
  - Si retorna 404: redirige automáticamente a `/pages/chef/onboarding.html`
- **Login:** `frontend/scripts/views/login.js`
  - Post-login verifica si hay perfil; redirige a onboarding si no existe

---

## Gaps No Críticos (Post-MVP)

### Cloudinary Upload Directo
- **Estado:** Los campos `photo_url` en chef y platos aceptan **URL manual** solamente.
- **Motivo:** La integración de upload directo a Cloudinary requiere credenciales de cuenta configuradas.
- **Configuración:** Ver `frontend/scripts/core/config.js` para las variables `CLOUDINARY_CLOUD_NAME` y `CLOUDINARY_UPLOAD_PRESET`.
- **Archivos afectados:** `dishes.js`, `config.js`

### Integración de Calendario Externo (Calendly / Google Calendar)
- **Estado:** Los campos en el modelo de citas (`external_calendar_id`, `calendly_event_id`, `google_event_id`) existen en la base de datos.
- **Motivo:** La integración con APIs externas de calendario está diferida para post-MVP.
- **Archivo backend:** `backend/app/appointments/services/appointment_service.py` — nota en línea 277.

### Módulo Scraper en Frontend
- **Estado:** La página `pages/dashboard/scraper.html` existe pero muestra un aviso de "módulo diferido".
- **Motivo:** El módulo de scraping está disponible en el backend pero la UI completa es post-MVP.

---

## Referencias

- **ADR-003:** `docs/decisions/003_client_users_and_requirements_audit.md`
- **Plan de frontend:** `docs/frontend/FRONTEND_PLAN.md`
- **Checklist de validación:** `docs/frontend/FRONTEND_VALIDATION_STATUS.md`
- **Documentación de API:** `docs/backend/API_DOCUMENTATION.md`
