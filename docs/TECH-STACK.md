# Tech Stack

> **Last updated:** 2026-04-06
> **Owner:** CTO / Engineer
> **Status:** Decided — implementation in progress

---

## Chosen Stack

| Layer       | Technology            | Version  | Notes |
|-------------|----------------------|---------|-------|
| Language    | TypeScript           | 5.x     | Type safety, better DX, easier onboarding |
| Runtime     | Node.js              | 20 LTS  | Widely familiar, good package ecosystem |
| Framework   | Fastify              | 4.x     | Better DX than Express: faster, schema validation built-in |
| Database    | PostgreSQL 16        | 16.x    | Via Supabase client / native `pg` driver |
| ORM/Query   | Kysely               | 0.27.x  | Type-safe SQL builder, no schema sync overhead of Prisma |
| Validation  | Zod                  | 3.x     | Schema validation for request/response; used with @fastify/type-provider-zod |
| Auth        | JWT (jose)           | 3.x     | Lightweight, edge-compatible; refresh token rotation |
| Passwords   | bcrypt               | 5.x     | Salted hashing, cost factor 12 |
| Testing     | Vitest               | 2.x     | Faster than Jest, native TypeScript, Vite-powered |
| Linting     | ESLint + Prettier    | 9.x / 3.x | Catch bugs, not style; Prettier handles formatting |
| API Docs    | @fastify/swagger     | 9.x     | OpenAPI 3.0 spec auto-generated from route schemas |
| CI/CD       | GitHub Actions       | —       | Native to GitHub, free for public + generous free tier |

---

## Rationale

### Why TypeScript?
TypeScript was decided in the founding vision. The DX benefits (autocomplete, refactor safety) justify the build complexity for a developer-focused product.

### Why Fastify over Express?
Fastify has:
- Built-in schema validation (tight integration with Zod via `@fastify/type-provider-zod`)
- Better performance (benchmarks consistently 2–3x faster than Express)
- Plugin system that composes cleanly — avoids callback/middleware chain hell
- Native OpenAPI/Swagger integration

Express remains widely used, but the DX and performance gap is real. Fastify wins for a new project.

### Why Kysely over Prisma?
Prisma's schema sync and migration system adds friction for a team building from scratch. Kysely gives us:
- Full SQL expressiveness without an ORM abstraction layer
- End-to-end TypeScript type inference for queries
- No schema `.prisma` file to maintain and sync
- Works with raw SQL when needed (e.g., full-text search, window functions)

The trade-off: Kysely doesn't auto-generate migrations. We write them manually (or via `db-migrate`/`node-pg-migrate`).

### Why Vitest over Jest?
Vitest is Jest-compatible API with:
- 10–20x faster cold start (Vite-powered)
- Native ESM support without config gymnastics
- Better TypeScript support out of the box

### Why @fastify/swagger?
Auto-generates OpenAPI 3.0 spec from Fastify route schemas (Zod schemas). Eliminates doc drift — the spec is always in sync with the code.

---

## Key Dependencies

| Package                         | Purpose                        | License |
|---------------------------------|--------------------------------|---------|
| `fastify`                       | HTTP framework                  | MIT     |
| `@fastify/type-provider-zod`   | Zod schema → Fastify type inference | MIT |
| `kysely`                        | Type-safe SQL query builder     | MIT     |
| `pg`                            | PostgreSQL driver              | MIT     |
| `@types/pg`                     | TypeScript types for pg        | MIT     |
| `zod`                           | Schema validation              | MIT     |
| `jose`                          | JWT signing/verification (edge-compatible) | MIT |
| `bcrypt`                        | Password hashing               | MIT     |
| `vitest`                        | Test runner                    | MIT     |
| `@vitest/coverage-v8`           | Coverage provider              | MIT     |
| `eslint`                        | Linter                         | MIT     |
| `prettier`                      | Code formatter                 | MIT     |
| `typescript`                    | Language                       | Apache  |
| `tsx`                           | TypeScript execution for scripts | MIT   |
| `db-migrate` / `node-pg-migrate`| Migration runner               | MIT     |

---

## Project Structure

```
/
├── src/
│   ├── app.ts               # Fastify app factory
│   ├── server.ts            # Entry point
│   ├── config/              # Environment config (typed)
│   ├── routes/              # Route handlers
│   │   ├── auth/
│   │   ├── documents/
│   │   └── pipelines/
│   ├── services/            # Business logic
│   ├── db/                  # DB client, migrations
│   │   └── migrations/
│   ├── middleware/          # Auth, validation
│   └── types/               # Shared TypeScript types
├── tests/
├── docs/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.cjs
└── .prettierrc
```

---

## Open Decisions

| Decision            | Options                    | Status    |
|---------------------|----------------------------|-----------|
| Hosting target      | Railway, Fly.io, Render    | TBD       |
| File storage        | S3-compatible (local dev: disk) | TBD   |
| Rate limiting       | @fastify/rate-limit       | TBD       |
| API key format      | UUID v4 or nanoid          | TBD       |

---

## Trade-offs

| Decision           | Trade-off |
|--------------------|-----------|
| Kysely (vs Prisma) | No auto-generated types from DB — must write migrations manually. Worth it for SQL expressiveness. |
| Fastify (vs Express) | Slightly smaller ecosystem of middleware. Plugin quality varies. Mitigated by picking established plugins. |
| JWT (vs sessions)  | Stateless is easier to scale horizontally. Refresh token rotation mitigates token leakage risk. |

---
_Tech stack locked as of 2026-04-06. Update this document when decisions change._
