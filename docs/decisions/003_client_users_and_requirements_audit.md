# ADR-003: Auditoría de Requerimientos y Plan de Acción para Usuarios Cliente

**Fecha**: 2 de Enero, 2026  
**Estado**: Pendiente de Implementación  
**Autor**: Frontend Agent  
**Para**: Main Agent, Backend Agent

---

## Resumen Ejecutivo

Este documento contiene:
1. **Auditoría completa** del enunciado original vs la implementación actual
2. **Plan de acción detallado** para implementar usuarios de tipo "Cliente" (si se decide extender el alcance)
3. **Lista de gaps** que deben cerrarse independientemente de la decisión sobre usuarios cliente

---

## Parte 1: Auditoría del Enunciado vs Implementación

### 1.1 Extracto del Enunciado Original

> Savora es una plataforma en línea diseñada para chefs, que les permite realizar una gestión integral de clientes, platillos, cotizaciones y menús. A través de Savora, los chefs pueden crear cotizaciones y menús, que pueden enviarse por correo electrónico a los clientes en formato PDF.
>
> Adicionalmente, existirá un landing page para que usuarios externos puedan ver la lista de chefs y ver su perfil con sus menús e información, y contactar a los chefs mediante un contáctanos.

### 1.2 Funcionalidades del Enunciado

| # | Funcionalidad | Descripción Original | Estado |
|---|---------------|---------------------|--------|
| 1 | **Gestión de Clientes** | CRUD completo. Cada chef puede tener varios clientes | ✅ Implementado |
| 2 | **Gestión de Platillos** | CRUD completo con fotos y pasos de preparación | ✅ Implementado |
| 3 | **Gestión de Menús** | CRUD con estados activos/inactivos | ✅ Implementado |
| 4 | **Gestión de Cotizaciones** | CRUD completo, pueden o no incluir menú | ✅ Implementado |
| 5 | **PDF de Cotización** | Generar PDF de cotización | ✅ Implementado |
| 6 | **Envío por Email** | Enviar cotización PDF por correo al cliente | ✅ Implementado |
| 7 | **Landing Page** | Lista de chefs pública | ✅ Implementado |
| 8 | **Perfil Público de Chef** | Ver perfil con menús e información | ✅ Implementado |
| 9 | **Contáctanos** | Formulario de contacto para usuarios externos | ✅ Implementado |

### 1.3 Páginas del Enunciado

| Página | Descripción | Estado Frontend | Estado Backend |
|--------|-------------|-----------------|----------------|
| Inicio (Sign up/Sign In) | Autenticación de chefs | ✅ Implementado | ✅ Implementado |
| Clientes | CRUD clientes del chef | 🟡 Estructura básica | ✅ API lista |
| Platillos | CRUD platillos | 🟡 Estructura básica | ✅ API lista |
| Menús | CRUD menús | 🟡 Estructura básica | ✅ API lista |
| Cotizaciones | CRUD + generación PDF | 🟡 Estructura básica | ✅ API lista |
| Perfil Público Chef | Página pública del chef | 🟡 Estructura básica | ✅ API lista |
| Landing Page | Lista de chefs | 🟡 Estructura básica | ✅ API lista |

### 1.4 Gaps Críticos Identificados

#### GAP-1: Envío de Email (✅ CERRADO)
**Descripción**: El enunciado indica que las cotizaciones "pueden enviarse por correo electrónico a los clientes en formato PDF". Estado actual:
- ✅ `GET /quotations/:id/pdf` genera el PDF
- ✅ `POST /quotations/:id/send` implementado en `quotation_controller.py`
- ✅ `EmailService` en `backend/app/core/services/email_service.py` (Mailtrap SMTP)
- ✅ Template HTML: `backend/app/core/templates/quotation_email.html`
- ✅ Modal de envío en frontend: `frontend/scripts/views/quotation-detail.js`

#### GAP-2: Formulario de Contacto (✅ CERRADO)
**Descripción**: El enunciado menciona "contactar a los chefs mediante un contáctanos". Estado actual:
- ✅ `POST /public/contact` implementado en `public_controller.py`
- ✅ Schema de validación: `backend/app/public/schemas/contact_schema.py`
- ✅ Template de notificación: `backend/app/core/templates/contact_notification.html`
- ✅ Formulario en frontend: `frontend/pages/public/chef-profile.html` + `public-chef-profile.js`

#### GAP-3: Onboarding de Perfil Chef (✅ CERRADO)
**Descripción**: Cuando un chef se registra, debe crear su perfil antes de poder usar la plataforma. Estado actual:
- ✅ Backend retorna 404 si no hay perfil (validación correcta)
- ✅ `frontend/pages/chef/onboarding.html` con formulario de creación de perfil
- ✅ Auth guard redirige automáticamente a onboarding si el perfil no existe
- ✅ Login detecta ausencia de perfil y redirige a onboarding

---

## Parte 2: Análisis - ¿Los Clientes Deben Ser Usuarios?

### 2.1 Interpretación del Enunciado

El enunciado **NO menciona explícitamente** que los clientes tengan login propio. Los "clientes" según el enunciado son:
- Contactos/registros CRM del chef
- Destinatarios de cotizaciones por email
- **No usuarios autenticados del sistema**

### 2.2 Arquitectura Actual

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUARIOS (auth.users)                   │
├─────────────────────────────────────────────────────────────────┤
│  Rol: CHEF                    │  Rol: ADMIN                     │
│  - Crea perfil de chef        │  - Gestión del sistema          │
│  - Gestiona clientes (CRM)    │  - Ver todos los datos          │
│  - Crea platillos/menús       │                                 │
│  - Genera cotizaciones        │                                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTES (core.clients)                    │
├─────────────────────────────────────────────────────────────────┤
│  - Registros CRM del chef                                       │
│  - Tienen: name, email, phone, company, notes                   │
│  - NO tienen login/password                                     │
│  - Reciben cotizaciones por email (TODO: implementar)           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Decisión: ¿Implementar CLIENT como Rol de Usuario?

#### Opción A: Mantener diseño actual (Recomendado para MVP)
- ✅ Cumple con el enunciado original
- ✅ Menor complejidad
- ✅ Listo más rápido
- ⚠️ Solo cerrar GAP-1 (email) y GAP-2 (contacto)

#### Opción B: Extender con usuarios Cliente
- ✅ Mejor UX para clientes frecuentes
- ✅ Portal de autoservicio
- ⚠️ Fuera del alcance del enunciado
- ⚠️ Requiere cambios significativos

**Recomendación**: Implementar **Opción A primero** para cerrar todos los gaps del enunciado, luego considerar Opción B como mejora futura.

---

## Parte 3: Plan de Acción para Cerrar Gaps del Enunciado

### 3.1 GAP-1: Implementar Envío de Email

#### 3.1.1 Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `backend/app/core/services/email_service.py` | Servicio de envío de emails |
| `backend/app/core/templates/quotation_email.html` | Template HTML del email |
| `backend/config/email_settings.py` | Configuración SMTP |

#### 3.1.2 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/quotations/routes/quotation_routes.py` | Agregar `POST /quotations/:id/send` |
| `backend/app/quotations/controllers/quotation_controller.py` | Agregar método `send_quotation()` |
| `backend/app/quotations/services/quotation_service.py` | Agregar lógica de envío |
| `backend/config/settings.py` | Agregar configuración de email |
| `backend/requirements.txt` | Agregar dependencias (Flask-Mail o python-emails) |

#### 3.1.3 Diseño de EmailService

```python
# backend/app/core/services/email_service.py
class EmailService:
    """Service for sending emails via SMTP"""
    
    def __init__(self):
        self.smtp_host = current_app.config['SMTP_HOST']
        self.smtp_port = current_app.config['SMTP_PORT']
        self.smtp_user = current_app.config['SMTP_USER']
        self.smtp_pass = current_app.config['SMTP_PASS']
        self.from_email = current_app.config['FROM_EMAIL']
    
    def send_quotation_email(
        self, 
        to_email: str, 
        client_name: str,
        chef_name: str,
        quotation_number: str,
        pdf_bytes: bytes
    ) -> bool:
        """
        Send quotation PDF to client via email
        
        Args:
            to_email: Client's email address
            client_name: Client's name for personalization
            chef_name: Chef's name
            quotation_number: Quotation reference number
            pdf_bytes: Generated PDF as bytes
            
        Returns:
            True if sent successfully
        """
        pass
    
    def send_contact_notification(
        self,
        chef_email: str,
        visitor_name: str,
        visitor_email: str,
        message: str
    ) -> bool:
        """
        Send contact form notification to chef
        """
        pass
```

#### 3.1.4 Endpoint: POST /quotations/:id/send

```python
# Request
POST /quotations/123/send
Authorization: Bearer <token>
Content-Type: application/json

{
    "send_to_client": true,          # Usar email del cliente asociado
    "custom_email": "alt@email.com", # O especificar email alternativo
    "custom_message": "¡Gracias por su interés!"  # Mensaje adicional
}

# Response 200
{
    "success": true,
    "message": "Quotation sent successfully",
    "sent_to": "client@email.com",
    "sent_at": "2026-01-02T12:00:00Z"
}

# Response 400
{
    "error": "No email address available for this quotation"
}
```

#### 3.1.5 Variables de Entorno Nuevas

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@Savora.com
SMTP_PASS=your-app-password
SMTP_USE_TLS=true
FROM_EMAIL=notifications@Savora.com
FROM_NAME=Savora
```

---

### 3.2 GAP-2: Implementar Formulario de Contacto

#### 3.2.1 Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `backend/app/public/schemas/contact_schema.py` | Validación del formulario |

#### 3.2.2 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/public/routes/public_routes.py` | Agregar `POST /public/contact` |
| `backend/app/public/controllers/public_controller.py` | Agregar `submit_contact_form()` |
| `backend/app/public/services/public_service.py` | Agregar lógica de contacto |
| `frontend/pages/chef-profile.html` | Agregar formulario de contacto |

#### 3.2.3 Endpoint: POST /public/contact

```python
# Request
POST /public/contact
Content-Type: application/json

{
    "chef_id": 5,
    "name": "María García",
    "email": "maria@email.com",
    "phone": "+52 55 1234 5678",  # Opcional
    "message": "Me gustaría cotizar para un evento de 50 personas..."
}

# Response 200
{
    "success": true,
    "message": "Your message has been sent to the chef"
}

# Response 400
{
    "error": "Invalid email format"
}

# Response 404
{
    "error": "Chef not found"
}
```

#### 3.2.4 Schema de Validación

```python
# backend/app/public/schemas/contact_schema.py
from marshmallow import Schema, fields, validate

class ContactFormSchema(Schema):
    """Schema for public contact form submission"""
    chef_id = fields.Integer(required=True)
    name = fields.String(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    message = fields.String(required=True, validate=validate.Length(min=10, max=2000))
```

---

### 3.3 GAP-3: Onboarding de Perfil Chef (Frontend)

#### 3.3.1 Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `frontend/pages/chef/onboarding.html` | Página de creación de perfil |
| `frontend/scripts/chef/onboarding.js` | Lógica del formulario |
| `frontend/styles/pages/onboarding.css` | Estilos específicos |

#### 3.3.2 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `frontend/scripts/core/state.js` | Verificar si tiene perfil en `init()` |
| `frontend/scripts/core/router.js` | Redirigir a onboarding si no tiene perfil |

#### 3.3.3 Flujo de Onboarding

```
┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│    Login OK      │────▶│  GET /chefs/me    │────▶│  ¿Tiene perfil?  │
└──────────────────┘     └───────────────────┘     └──────────────────┘
                                                           │
                              ┌─────────────────────────────┼─────────────────┐
                              ▼                             ▼                 │
                        ┌───────────┐               ┌───────────────┐         │
                        │    SÍ     │               │      NO       │         │
                        └───────────┘               └───────────────┘         │
                              │                             │                 │
                              ▼                             ▼                 │
                    ┌─────────────────┐         ┌─────────────────────┐      │
                    │    Dashboard    │         │   /chef/onboarding  │      │
                    └─────────────────┘         └─────────────────────┘      │
                                                          │                  │
                                                          ▼                  │
                                                ┌─────────────────────┐      │
                                                │  POST /chefs/me     │      │
                                                │  (crear perfil)     │──────┘
                                                └─────────────────────┘
```

---

## Parte 4: Plan de Acción para Usuarios Cliente (EXTENSIÓN OPCIONAL)

> ⚠️ **NOTA**: Esta sección describe cómo implementar usuarios tipo Cliente si se decide extender el alcance más allá del enunciado original.

### 4.1 Cambios en Modelo de Datos

#### 4.1.1 Modificar UserRole Enum

```python
# backend/app/auth/models/user_model.py
class UserRole(enum.Enum):
    """User role enumeration."""
    CHEF = "chef"
    ADMIN = "admin"
    CLIENT = "client"  # NUEVO
```

#### 4.1.2 Modificar Modelo Client

```python
# backend/app/clients/models/client_model.py
class Client(Base):
    __tablename__ = 'clients'
    __table_args__ = {'schema': 'core'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    chef_id = Column(Integer, ForeignKey('core.chefs.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(Integer, ForeignKey('auth.users.id', ondelete='SET NULL'), nullable=True)  # NUEVO - opcional
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=True)
    # ... resto igual
    
    # Relationships
    chef = relationship("Chef", backref="clients")
    user = relationship("User", backref="client_profile")  # NUEVO
```

#### 4.1.3 Nueva Migración Alembic

```python
# backend/alembic/versions/xxx_add_client_user_role.py
def upgrade():
    # 1. Add CLIENT to UserRole enum
    op.execute("ALTER TYPE auth.userrole ADD VALUE 'client'")
    
    # 2. Add user_id column to clients table
    op.add_column('clients', 
        sa.Column('user_id', sa.Integer(), nullable=True),
        schema='core'
    )
    op.create_foreign_key(
        'fk_clients_user_id',
        'clients', 'users',
        ['user_id'], ['id'],
        source_schema='core',
        referent_schema='auth',
        ondelete='SET NULL'
    )
    op.create_index('ix_clients_user_id', 'clients', ['user_id'], schema='core')

def downgrade():
    op.drop_index('ix_clients_user_id', table_name='clients', schema='core')
    op.drop_constraint('fk_clients_user_id', 'clients', schema='core', type_='foreignkey')
    op.drop_column('clients', 'user_id', schema='core')
    # Note: Cannot remove enum value in PostgreSQL, would need to recreate type
```

### 4.2 Cambios en Endpoints de Auth

#### 4.2.1 Modificar Registro

```python
# backend/app/auth/routes/auth_routes.py

# Agregar endpoint de registro para clientes
@auth_bp.route('/register/client', methods=['POST'])
def register_client():
    """
    POST /auth/register/client
    Register as a client user
    
    Body:
    {
        "username": "cliente123",
        "email": "cliente@email.com",
        "password": "securepass"
    }
    """
    return AuthController.register_client()
```

#### 4.2.2 Nuevo Endpoint GET /auth/me para Clientes

```python
# Response cuando role == CLIENT
{
    "id": 10,
    "username": "cliente123",
    "email": "cliente@email.com",
    "role": "client",
    "client_profile": {
        "id": 50,
        "name": "Juan Cliente",
        "chef_id": 5,
        "chef_name": "Chef María"
    },
    "quotations_received": 3
}
```

### 4.3 Nuevos Endpoints para Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/clients/me` | Obtener mi perfil de cliente | CLIENT |
| `PUT` | `/clients/me` | Actualizar mi perfil | CLIENT |
| `GET` | `/clients/me/quotations` | Ver cotizaciones recibidas | CLIENT |
| `GET` | `/clients/me/quotations/:id` | Ver detalle de cotización | CLIENT |
| `PATCH` | `/clients/me/quotations/:id/respond` | Aceptar/rechazar cotización | CLIENT |
| `GET` | `/clients/me/quotations/:id/pdf` | Descargar PDF | CLIENT |

### 4.4 Middleware de Autorización

```python
# backend/app/core/middleware/auth_middleware.py

def client_required(f):
    """Decorator that requires CLIENT role"""
    @wraps(f)
    @jwt_required
    def decorated_function(*args, **kwargs):
        if g.current_user.role != UserRole.CLIENT:
            return jsonify({"error": "Client access required"}), 403
        return f(*args, **kwargs)
    return decorated_function
```

### 4.5 Flujo de Vinculación Chef-Cliente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE VINCULACIÓN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OPCIÓN A: Cliente se registra primero                                     │
│  ───────────────────────────────────────                                   │
│  1. Usuario se registra como CLIENT                                         │
│  2. Chef crea cliente en su CRM con mismo email                             │
│  3. Sistema detecta match y vincula user_id al cliente                      │
│                                                                             │
│  OPCIÓN B: Chef crea cliente, cliente se registra después                   │
│  ────────────────────────────────────────────────────────                   │
│  1. Chef crea cliente con email "juan@email.com"                            │
│  2. Juan se registra con "juan@email.com" como CLIENT                       │
│  3. Sistema detecta match y vincula automáticamente                         │
│                                                                             │
│  OPCIÓN C: Chef invita a cliente                                            │
│  ─────────────────────────────────                                          │
│  1. Chef crea cliente y hace click en "Invitar al Portal"                   │
│  2. Sistema genera link de invitación único                                 │
│  3. Cliente hace click y completa registro                                  │
│  4. Vinculación automática                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Frontend para Clientes

#### 4.6.1 Archivos a Crear

| Archivo | Propósito |
|---------|-----------|
| `frontend/pages/client/dashboard.html` | Dashboard del cliente |
| `frontend/pages/client/quotations.html` | Lista de cotizaciones recibidas |
| `frontend/pages/client/quotation-detail.html` | Detalle de cotización |
| `frontend/scripts/client/dashboard.js` | Lógica del dashboard |
| `frontend/scripts/client/quotations.js` | Lógica de cotizaciones |
| `frontend/styles/pages/client-dashboard.css` | Estilos del portal cliente |

#### 4.6.2 Rutas Frontend

```javascript
// frontend/scripts/core/router.js

const routes = {
    // Rutas públicas
    '/': 'landing',
    '/login': 'auth/login',
    '/register': 'auth/register',
    '/register/client': 'auth/register-client',  // NUEVO
    
    // Rutas de Chef (existentes)
    '/dashboard': 'chef/dashboard',
    '/clients': 'chef/clients',
    // ...
    
    // Rutas de Cliente (NUEVAS)
    '/client/dashboard': 'client/dashboard',
    '/client/quotations': 'client/quotations',
    '/client/quotations/:id': 'client/quotation-detail',
    '/client/profile': 'client/profile',
};
```

---

## Parte 5: Orden de Implementación Recomendado

### Fase A: Cerrar Gaps del Enunciado (Prioridad ALTA)

| Orden | Tarea | Tiempo Est. | Dependencias |
|-------|-------|-------------|--------------|
| A.1 | Configurar servicio de email | 2h | - |
| A.2 | Implementar `POST /quotations/:id/send` | 3h | A.1 |
| A.3 | Implementar `POST /public/contact` | 2h | A.1 |
| A.4 | Frontend: Formulario de contacto en perfil público | 2h | A.3 |
| A.5 | Frontend: Botón "Enviar cotización" + modal | 2h | A.2 |
| A.6 | Frontend: Onboarding de perfil chef | 3h | - |
| **Total Fase A** | | **14h** | |

### Fase B: Usuarios Cliente (Prioridad BAJA - Extensión)

| Orden | Tarea | Tiempo Est. | Dependencias |
|-------|-------|-------------|--------------|
| B.1 | Agregar CLIENT a UserRole + migración | 1h | - |
| B.2 | Modificar modelo Client (user_id) + migración | 2h | B.1 |
| B.3 | Endpoint `POST /auth/register/client` | 2h | B.2 |
| B.4 | Endpoints de cliente autenticado | 4h | B.3 |
| B.5 | Lógica de vinculación automática | 3h | B.4 |
| B.6 | Frontend: Portal de cliente | 6h | B.5 |
| B.7 | Tests unitarios e integración | 4h | B.6 |
| **Total Fase B** | | **22h** | |

---

## Parte 6: Checklist de Implementación

### ✅ Pre-requisitos
- [ ] Tener cuenta SMTP configurada (Gmail App Password, SendGrid, etc.)
- [ ] Definir templates de email
- [ ] Confirmar con stakeholder si Fase B es necesaria

### ✅ Fase A - Email Service
- [ ] Crear `backend/app/core/services/email_service.py`
- [ ] Agregar configuración SMTP a `config/settings.py`
- [ ] Agregar `Flask-Mail` a `requirements.txt`
- [ ] Crear template HTML para cotizaciones
- [ ] Crear template HTML para notificaciones de contacto
- [ ] Implementar `POST /quotations/:id/send`
- [ ] Implementar `POST /public/contact`
- [ ] Actualizar documentación API
- [ ] Agregar tests unitarios
- [ ] Agregar tests de integración

### ✅ Fase A - Frontend
- [ ] Crear página de onboarding `/chef/onboarding`
- [ ] Modificar `AppState.init()` para verificar perfil
- [ ] Agregar formulario de contacto en perfil público
- [ ] Agregar botón "Enviar" en detalle de cotización
- [ ] Agregar modal de confirmación de envío
- [ ] Mostrar feedback de éxito/error

### ✅ Fase B - Usuarios Cliente (Opcional)
- [ ] Migración: agregar CLIENT a enum
- [ ] Migración: agregar user_id a clients
- [ ] Endpoint: `POST /auth/register/client`
- [ ] Endpoint: `GET /clients/me`
- [ ] Endpoint: `GET /clients/me/quotations`
- [ ] Endpoint: `PATCH /clients/me/quotations/:id/respond`
- [ ] Middleware: `@client_required`
- [ ] Frontend: Registro de cliente
- [ ] Frontend: Dashboard cliente
- [ ] Frontend: Lista de cotizaciones
- [ ] Tests completos

---

## Parte 7: Preguntas para el Stakeholder

Antes de implementar la Fase B, confirmar:

1. **¿Los clientes necesitan login propio?**
   - El enunciado no lo requiere explícitamente
   - Si solo necesitan recibir cotizaciones por email, Fase A es suficiente

2. **¿Cómo se vincula cliente-chef?**
   - ¿Por email automáticamente?
   - ¿Por invitación del chef?
   - ¿Puede un cliente tener múltiples chefs?

3. **¿Qué puede hacer el cliente en el portal?**
   - ¿Solo ver cotizaciones?
   - ¿Aceptar/rechazar?
   - ¿Ver historial?
   - ¿Editar su perfil?

---

## Conclusión

**Recomendación**: Implementar **Fase A** primero (14h estimadas) para cerrar todos los gaps del enunciado original. Esto incluye:
- ✅ Servicio de email
- ✅ Envío de cotizaciones por email
- ✅ Formulario de contacto público
- ✅ Onboarding de perfil chef

La **Fase B** (usuarios cliente autenticados) es una extensión que va más allá del enunciado original y debe evaluarse según las necesidades del negocio.

---

**Documento creado por**: Frontend Agent  
**Para implementación por**: Main Agent / Backend Agent  
**Fecha**: 2 de Enero, 2026

