# CI/CD Pipeline

## Pipeline Overview

- **Tooling**: GitHub Actions
- **Strategy**: Trunk-based development with required CI checks on all PRs
- **Branch protection**: `main` requires passing CI and at least 1 approving review

## CI Workflow

**Status: Implemented** at `.github/workflows/ci.yml`

Runs on: **PRs and pushes to `main`**

| Stage      | Trigger            | What it does                           | Blocks merge |
|------------|--------------------|----------------------------------------|--------------|
| Install    | PR, push to main   | `npm ci` — install dependencies        | Yes          |
| Type Check | PR, push to main   | `tsc --noEmit` — TypeScript compiler  | Yes          |
| Lint       | PR, push to main   | `npm run lint` — ESLint + Prettier   | Yes          |
| Test       | PR, push to main   | `npm run test` — Vitest test suite    | Yes          |

### Workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    name: Lint, Type Check & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run build

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/docustract_test
          JWT_SECRET: test-jwt-secret-that-is-at-least-32-chars
```

## CD Workflow

**Status: Render blueprint configured** — `render.yaml` and `.github/workflows/cd.yml` ready.

### Render Blueprint: `render.yaml`

Blueprint configuration for Render auto-scaling web service.

### CD Workflow: `.github/workflows/cd.yml`

Triggered on push to `main`:
1. Calls Render Deploy API to trigger a new deployment
2. Waits 30 seconds for the deploy to complete
3. Runs smoke test against `GET /health`

### Setup Instructions

1. Push the updated `.github/workflows/` directory to the repo
2. Add required secrets in **GitHub repo → Settings → Secrets**:
   - `RENDER_API_KEY` — Render API key from render.com
3. Add required variables in **GitHub repo → Settings → Variables**:
   - `RENDER_API_URL` — Render API base URL
   - `RENDER_SERVICE_ID` — Your Render service ID
   - `RENDER_DEPLOY_URL` — Your Render deployment URL
4. On Render, connect the repo and configure environment variables:
   - `DATABASE_URL` — Production database connection string
   - `JWT_SECRET` — JWT signing secret (min 32 chars)
   - `APPWRITE_ENDPOINT` — Appwrite endpoint
   - `APPWRITE_PROJECT_ID` — Appwrite project ID
   - `APPWRITE_SECRET` — Appwrite secret key
   - `APPWRITE_BUCKET_ID` — Appwrite bucket ID
   - `NODE_ENV=production`
5. Enable branch protection on `main` to require CI status checks before CD triggers

## Environment Variables

| Variable           | Where set          | Purpose                               |
|-------------------|--------------------|---------------------------------------|
| `DATABASE_URL`    | GitHub Secrets     | Primary database connection string    |
| `JWT_SECRET`       | GitHub Secrets     | JWT signing secret (min 32 chars)    |
| `NODE_ENV`         | Workflow hardcoded | `test` for CI, `production` for CD   |
| `DEPLOY_TOKEN`     | GitHub Secrets     | Token for deploying to cloud provider  |
| `SLACK_WEBHOOK`    | GitHub Secrets     | Deployment notification webhook        |

## Rollback Procedure

1. **Identify the failing deployment** — check GitHub Actions run logs
2. **Revert the merge commit** — `git revert <merge-commit-sha>` and open a PR
3. **Verify rollback via CI** — ensure the revert passes all checks
4. **Merge the revert** — deploys the previous known-good state
5. **Investigate root cause** before re-deploying the fix

## Setup Instructions

1. Push the `.github/workflows/` directory to the repo
2. Add required secrets in **GitHub repo → Settings → Secrets**
3. Configure branch protection on `main` to require CI status checks
4. Update CD workflow with actual deploy commands once hosting provider is chosen
