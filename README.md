# DocuStract

_A modern document processing pipeline — reliable, REST-idiomatic, and built for developers._

DocuStract is the API-first alternative to legacy document processing platforms. It competes on what incumbents get wrong: idiomatic REST endpoints, transparent self-serve pricing, lightweight onboarding, and excellent developer experience.

## Status

| Component | Status |
|-----------|--------|
| REST API (auth, documents, pipelines) | ✅ Complete |
| JWT authentication | ✅ Complete |
| Zod request validation | ✅ Complete |
| CI/CD (ESLint, Vitest, GitHub Actions) | ✅ Complete |
| API integration tests | ✅ 109 passing |
| Observability & monitoring | ✅ Complete |
| Documentation | ✅ Complete |
| Security hardening | ✅ Complete |
| Production readiness | ✅ Complete (pending Render deployment) |

## Tech Stack

**Runtime:** Node.js 20 · **Framework:** Fastify · **Database:** PostgreSQL (via Kysely) · **Validation:** Zod · **Auth:** JWT · **Testing:** Vitest · **Linting:** ESLint + Prettier

See [docs/TECH-STACK.md](docs/TECH-STACK.md) for full rationale behind each choice.

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Environment variables (see `.env.example`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd projects/DocuStract

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate:up

# Run the test suite
npm test

# Lint
npm run lint

# Type-check
npm run build
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch
```

### Production

```bash
# Build the project
npm run build

# Start the server
npm start
```

## Project Structure

```
src/
  app.ts           # Fastify app definition
  server.ts        # Server entry point
  config/          # Environment and validation (Zod)
  db/              # Database client (Kysely)
  middleware/      # Auth middleware (JWT)
  routes/          # Route handlers
    auth/          # /api/v1/auth — register, login, refresh, me
    documents/    # /api/v1/documents — CRUD
    pipelines/     # /api/v1/pipelines — CRUD
    health.ts      # /health
  services/        # Business logic
  types/           # TypeScript types
tests/
  api.integration.test.ts   # Fastify inject() integration tests
  config.test.ts            # Zod config validation tests
migrations/       # Database schema migrations
docs/             # Full project documentation
```

## API Overview

Base URL: `/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register a new user |
| `POST /auth/login` | Login and receive tokens |
| `POST /auth/refresh` | Refresh access token |
| `GET /auth/me` | Get current user info |
| `POST /documents` | Upload a document |
| `GET /documents` | List documents |
| `GET /documents/:id` | Get a document |
| `DELETE /documents/:id` | Delete a document |
| `POST /pipelines` | Create a pipeline |
| `GET /pipelines` | List pipelines |
| `GET /pipelines/:id` | Get a pipeline |
| `DELETE /pipelines/:id` | Delete a pipeline |
| `GET /health` | Health check |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

## Documentation

| Document | What it covers |
|---------|---------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flow, component overview |
| [TECH-STACK.md](docs/TECH-STACK.md) | Technology choices and rationale |
| [VISION.md](docs/VISION.md) | Strategy, positioning, success metrics |
| [CI-CD.md](docs/CI-CD.md) | CI/CD pipeline configuration |
| [MONITORING.md](docs/MONITORING.md) | Observability, logging, alerting |
| [ROADMAP.md](docs/ROADMAP.md) | Phase-by-phase delivery plan |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Branch strategy, PR process, code review |
| [COMPETITIVE-LANDSCAPE.md](docs/COMPETITIVE-LANDSCAPE.md) | Market positioning and competitors |
| [DEPENDENCY-AUDIT.md](docs/DEPENDENCY-AUDIT.md) | Security audit and dependency analysis |
| [RELEASE-PROCESS.md](docs/RELEASE-PROCESS.md) | Release procedures and deployment checklist |
| [BRAND-IDENTITY.md](docs/BRAND-IDENTITY.md) | Brand guidelines and visual identity |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Design system and component library |
| [PROJECT_COMPLETION_SUMMARY.md](PROJECT_COMPLETION_SUMMARY.md) | Complete project status and deployment guide |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full workflow — branch naming, commit conventions, PR process, and code review roles.

## License

MIT
