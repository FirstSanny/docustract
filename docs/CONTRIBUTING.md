# Contributing to DocuStract

## Quick Start

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Lint: `npm run lint`

## Branch Naming

```
<prefix>-<N>/<short-description>
```

Example: `doca-42/add-user-auth-endpoint`

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`

Rules: lowercase after colon, no period, under 72 characters.

## Pull Request Process

1. Create a branch for your work
2. Make changes and commit with conventional messages
3. Open a PR with a description of what changed and why
4. Ensure CI passes (lint, tests, build)
5. Request review from Code Reviewer and Product Owner
6. Merge once approved

## Code Review

Two-role review:
- **Code Reviewer**: Correctness, security, style, simplicity
- **Product Owner**: Intent alignment, scope discipline, acceptance criteria

## What Requires a PR

- Code logic changes
- API changes
- Database schema changes
- Agent configurations
- Infrastructure changes

**Direct-to-main OK**: typos, comment-only changes, minor doc fixes.

## Getting Help

See [docs/](docs/) for full documentation. For questions, open an issue.