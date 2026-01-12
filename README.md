# CaterPro

Full-stack catering management platform with role-based access control, caching, and modular architecture.

**Author**: [Andrey Quesada](https://github.com/andreyques41) | Software Engineer | Full-Stack Development & AI Workflows

---

## Stack

**Backend**: Flask, PostgreSQL, Redis, JWT Authentication, SQLAlchemy  
**Frontend**: HTML, CSS, Vanilla JS, Vite  
**Testing**: Pytest, Coverage  
**Docs**: OpenAPI/Swagger

---

## Architecture

```
├── backend/          # Flask API (controllers/services/repositories)
├── frontend/         # Modular JS with Vite
├── config/           # Environment configuration
├── tests/            # Unit and integration tests
└── docs/             # API documentation
```

**Layered Architecture**: Routes → Controllers → Services → Repositories → Models

---

## Features

- User authentication with JWT and role-based access (Admin/Chef/Client)
- Event and menu management with pricing
- Redis caching for performance optimization
- Layered architecture with clear separation of concerns
- 60+ REST endpoints
- 497 tests with 85% coverage

---

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
flask run

# Frontend
cd frontend
npm install
npm run dev
```

---

## What This Demonstrates

- Production-grade layered architecture
- JWT authentication and authorization
- PostgreSQL with SQLAlchemy ORM
- Redis caching strategies
- Comprehensive testing (unit + integration)
- RESTful API design
- Frontend-backend integration

---

**GitHub**: [andreyques41/caterpro](https://github.com/andreyques41/caterpro)
