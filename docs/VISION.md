# Company Vision

> **Last updated:** 2026-04-05
> **Owner:** CEO
> **Status:** Initial — refine as product evidence accumulates

---

## Vision Statement

_Building a better docupipe.ai — a modern document processing pipeline that is reliable, well-documented, and easy to extend._

DocuStract competes on what incumbents get wrong: REST-idiomatic APIs, transparent self-serve pricing, lightweight self-serve onboarding, and excellent developer experience. Every decision flows from this north star.

---

## Mission

Create a document processing pipeline with a solid TypeScript REST API foundation, automated CI/CD, comprehensive documentation, and a developer experience that makes teams choose DocuStract over opaque enterprise alternatives.

---

## Competitive Positioning

DocuStract's moat is **developer trust** — earned through:

1. **REST-native from day one** — not bolted on. Idiomatic endpoints, not a wrapped legacy API.
2. **Transparent pricing** — no sales call required to know what you'll pay. Self-serve tiers.
3. **Lightweight** — smaller teams self-serve without professional services.
4. **Modern stack** — TypeScript REST API signals maintainability and developer familiarity.
5. **Comprehensive docs** — every endpoint documented, every decision explained.

**Where we lose:**
- Compliance-heavy regulated industries (HIPAA/SOC2) — we don't have these yet
- Deep ERP integration needs — Rossum owns this
- Teams already deep in AWS/Azure who want managed infrastructure

See [docs/COMPETITIVE-LANDSCAPE.md](docs/COMPETITIVE-LANDSCAPE.md) for full competitive analysis.

---

## Success Metrics

### Quarter 1 — Foundation (Current)

| Metric | Target | Current | Status |
|--------|-------|---------|--------|
| **API uptime** | 99.5% | TBD | 🔴 |
| **API response time (p99)** | < 500ms | TBD | 🔴 |
| **Core endpoints operational** | 8 endpoints | 0 | 🔴 |
| **API docs coverage** | 100% endpoint coverage | 0% | 🔴 |
| **CI pipeline pass rate** | 100% | TBD | 🔴 |
| **Automated test coverage** | 80%+ | 0% | 🔴 |
| **Lint pass rate** | 100% | TBD | 🔴 |
| **Deployment frequency** | On-demand | 0 | 🔴 |
| **Self-serve setup time** | < 15 min | N/A | — |

### Quarter 2 — Growth

| Metric | Target | Current | Status |
|--------|-------|---------|--------|
| **API uptime** | 99.9% | — | — |
| **API response time (p99)** | < 200ms | — | — |
| **Document format coverage** | PDF, DOCX, PNG, JPG | — | — |
| **Active API keys** | 50 | — | — |
| **Self-serve onboarding completion** | > 80% | — | — |

### Quarter 3 — Scale

| Metric | Target | Current | Status |
|--------|-------|---------|--------|
| **API uptime** | 99.9% | — | — |
| **API response time (p99)** | < 100ms | — | — |
| **Compliance** | GDPR-ready | — | — |
| **Enterprise integrations** | 1 major ERP | — | — |

---

## Strategic Milestones

### Milestone 1: Foundation — CI/CD, Linting, Testing, Build *(In Progress)*
**Goal:** Automated, zero-manual pipelines that catch issues before they reach users.

- [x] Automated linting (ESLint/Prettier)
- [x] Automated testing (unit + integration)
- [x] Automated build verification
- [x] PR-gated checks (no force-push to main)
- [ ] Deployment automation
- [ ] Staging environment parity

**Why first:** Every downstream decision depends on reliable automation. No CI = no confidence.

**Owner:** DevOps / CTO

---

### Milestone 2: Schema Design *(Planned)*
**Goal:** Define data models that are stable, typed, and extendable.

- [ ] Document entity schema (id, name, type, status, metadata, timestamps)
- [ ] Pipeline definition schema
- [ ] API request/response type definitions (TypeScript interfaces)
- [ ] Database schema (PostgreSQL via Supabase)

**Why second:** Schema is the contract between every layer. Wrong schema = expensive rewrites.

**Owner:** CTO

---

### Milestone 3: Core REST API *(Planned)*
**Goal:** A complete, documented, REST-idiomatic API for document processing.

- [ ] `POST /documents` — Upload a document
- [ ] `GET /documents` — List documents
- [ ] `GET /documents/:id` — Get document details
- [ ] `DELETE /documents/:id` — Delete a document
- [ ] `POST /pipelines` — Create a processing pipeline
- [ ] `GET /pipelines/:id/status` — Check pipeline status
- [ ] `GET /pipelines/:id/result` — Get processing result
- [ ] `DELETE /pipelines/:id` — Cancel/delete a pipeline

Auth endpoints:
- [ ] `POST /auth/register`
- [ ] `POST /auth/login`
- [ ] `POST /auth/refresh`

**Why third:** API is the product. REST-first means every design decision is visible to developers.

**Owner:** CTO

---

### Milestone 4: Authentication & Authorization *(Planned)*
**Goal:** Secure, token-based auth with role-based access control.

- [ ] JWT-based authentication
- [ ] API key management (create, revoke, rotate)
- [ ] Role-based permissions (admin, editor, viewer)
- [ ] Rate limiting per API key

**Owner:** CTO

---

### Milestone 5: API Documentation *(Planned)*
**Goal:** Every endpoint fully documented — no "see source code."

- [ ] OpenAPI 3.0 spec auto-generated from route definitions
- [ ] Interactive Swagger UI
- [ ] Request/response examples for all endpoints
- [ ] Error code reference (DOC-XXX codes)
- [ ] Authentication guide
- [ ] Quickstart guide (5-minute setup)

**Owner:** CTO

---

## Non-Goals

What we are **deliberately not doing** (yet):

- **HIPAA/SOC2 compliance** — Requires significant investment; revisit in Q3+
- **Pre-built extraction models** — Competitors do this; we focus on pipeline reliability first
- **Enterprise ERP connectors** — Rossum's moat; not our differentiator
- **Human-in-the-loop review** — Adds latency; revisit if customer evidence demands it
- **Proprietary document formats** — Interoperability is a core principle
- **Manual deployment processes** — Everything automated, always

---

## Principles

Every decision is tested against these:

1. **Developer experience first** — If it's not easy to use, it's not done.
2. **REST-idiomatic** — Resources, verbs, status codes. No RPC-style wrappers.
3. **Observable** — Logs, metrics, traces. If you can't see it, you can't trust it.
4. **Composable** — Small, focused endpoints that chain together.
5. **Transparent** — Public pricing, open decisions, honest docs.

---

## Roadmap Phases

```
Phase 1: Foundation (Q1)
  └── CI/CD → Schema → Auth → Core API → API Docs

Phase 2: Reliability (Q2)
  └── Performance optimization → Monitoring → Self-serve onboarding

Phase 3: Growth (Q3)
  └── Compliance (GDPR) → Document format expansion → First integrations
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Incumbents add REST APIs | Medium | High | Move fast; our REST story must stay ahead |
| Cloud provider price cuts | Low | Medium | Emphasize portability and self-hosting option |
| Compliance gap blocks enterprise | High | High | Build GDPR roadmap into Q3; plan SOC2 for Q4 |
| Schema changes break clients | Medium | High | Versioned API (v1) from day one; changelog |

---

## Key Decisions

| Decision | Context | Rationale |
|----------|---------|-----------|
| TypeScript over JavaScript | Q1 | Type safety, better DX, easier onboarding for contributors |
| REST over GraphQL | Q1 | Better HTTP semantics, easier to cache, simpler mental model |
| Supabase (PostgreSQL) | Q1 | Battle-tested, good DX, built-in auth, self-hostable |
| Express/Fastify | Q1 | Mature ecosystem, TypeScript support, wide contributor familiarity |
| Zero proprietary formats | Founding | Interoperability is non-negotiable |

---

_This document is the north star for all downstream planning. Update when strategy shifts — but when you update it, document why._
