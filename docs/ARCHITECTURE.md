# System Architecture

> **Last updated:** 2026-04-06
> **Owner:** CTO / Engineer

## Overview

DocuStract is a document processing pipeline with a REST API at its core. The system handles document ingestion, transformation, and delivery through a well-defined API layer.

## Components

| Component       | Responsibility                                | Technology       |
|----------------|----------------------------------------------|-----------------|
| REST API       | Expose document processing endpoints          | Fastify 4 (TypeScript) |
| Database       | Persistent storage for documents and metadata | PostgreSQL 16 (via Kysely) |
| Auth Service   | Authentication and authorization              | JWT (jose) + bcrypt |
| CI/CD Pipeline | Automated linting, testing, building, deployment | GitHub Actions |

## Data Flow

```
Client → Fastify REST API → PostgreSQL → Response
                     ↓
              JWT Auth Middleware
              Zod Validation
              OpenAPI/Swagger Docs
```

## API Boundaries

### External APIs
REST API for clients to interact with the document processing system.

**Base URL:** `http://localhost:3000` (dev)

**API Version:** v1 (`/api/v1`)

| Group     | Endpoints                                         |
|-----------|---------------------------------------------------|
| Auth      | POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/me |
| Documents | POST /documents, GET /documents, GET /documents/:id, PATCH /documents/:id, DELETE /documents/:id |
| Pipelines | POST /pipelines, GET /pipelines, GET /pipelines/:id, GET /pipelines/:id/status, GET /pipelines/:id/result, DELETE /pipelines/:id |
| Docs      | GET /api-docs (Swagger UI)                        |
| Health    | GET /health                                      |

### Internal APIs
Internal service communication (TBD as architecture matures).

## Deployment Model

- **Build**: `npm run build` → TypeScript compiles to `dist/`
- **Test**: `npm run test` → Vitest test suite with coverage
- **Deploy**: TBD — GitHub Actions CD workflow template ready (target: Railway / Fly.io / Render)

## Key Decisions

| Decision              | Context | Rationale |
|----------------------|---------|-----------|
| Fastify over Express  | Q1      | Built-in schema validation, faster, better DX |
| Kysely over Prisma    | Q1      | No schema sync overhead, full SQL expressiveness |
| JWT over sessions     | Q1      | Stateless = horizontal scaling without sticky sessions |
| Vitest over Jest      | Q1      | 10–20x faster cold start, native ESM |

## Project Structure

```
src/
├── app.ts               # Fastify app factory
├── server.ts            # Entry point
├── config/
│   └── index.ts         # Environment config (Zod-validated)
├── db/
│   ├── index.ts         # Kysely DB client
│   └── migrations/      # (SQL migrations in /migrations/)
├── routes/
│   ├── auth/
│   │   └── index.ts     # Auth endpoints
│   ├── documents/
│   │   └── index.ts     # Document CRUD
│   ├── pipelines/
│   │   └── index.ts     # Pipeline endpoints
│   └── health.ts        # Health check
├── services/
│   ├── auth.ts          # Auth business logic
│   ├── documents.ts     # Document operations
│   └── pipelines.ts     # Pipeline operations
├── middleware/
│   └── auth.ts          # JWT verification middleware
└── types/
    └── index.ts         # Shared TypeScript types
migrations/
├── 001_create_users.sql
├── 002_create_api_keys.sql
├── 003_create_documents.sql
└── 004_create_pipelines.sql
.github/workflows/
└── ci.yml              # CI: lint, type check, test
```

---
_Architecture documentation updated as decisions are made._
