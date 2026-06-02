# Release Process

## Overview

This project uses **semantic versioning (semver)** with a **trunk-based development** strategy.
Releases are cut from `main` via annotated git tags. A GitHub Release is created for each tag,
backed by an auto-generated changelog.

## Versioning

Format: `MAJOR.MINOR.PATCH` (e.g. `1.2.3`)

| Increment | When to bump | Example |
|-----------|-------------|---------|
| `MAJOR` | Breaking changes to public API | `1.0.0` → `2.0.0` |
| `MINOR` | New backward-compatible feature | `1.0.0` → `1.1.0` |
| `PATCH` | Backward-compatible bug fix | `1.0.0` → `1.0.1` |

### Pre-release versions

During active development, versions may carry a pre-release suffix:

```
1.0.0-alpha.0   # alpha — unstable, expect breaking changes
1.0.0-beta.0    # beta — more stable, breaking changes discouraged
1.0.0-rc.0      # release candidate — feature-frozen, polish only
```

## Branching Strategy

- **`main`** — always releasable, all CI checks must pass
- **Feature branches** — `feat/`, `fix/`, `chore/` prefixed; PRs required
- **No long-lived release branches** — hotfixes applied directly to `main` and tagged

## Changelog

A `CHANGELOG.md` is maintained manually with sections:

```markdown
## [1.2.3] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Breaking
- ...
```

When a release is cut, the `CHANGELOG.md` entry is finalized and committed with the tag.

## Release Workflow

### 1. Prepare

```
# Ensure main is up to date
git checkout main && git pull origin main

# Verify CI passes locally (or rely on GitHub Actions)
npm test && npm run build
```

### 2. Bump version

Use the `bump` script (to be created — placeholder):

```bash
# Interactive
npm run bump

# Or explicit
npm run bump -- --version minor   # bumps 1.0.0 → 1.1.0
npm run bump -- --version patch    # bumps 1.0.0 → 1.0.1
npm run bump -- --version major    # bumps 1.0.0 → 2.0.0
```

This will:
- Update `package.json` `version` field
- Create/update `CHANGELOG.md` entry with unreleased changes
- Commit with message `chore: bump version to v{version}`
- Create an **unsigned** tag `v{version}`

> **Note:** For now (no `bump` script), manually update `package.json` and `CHANGELOG.md`,
> then run `git tag -a v{version} -m "Release v{version}"` and `git push --follow-tags`.

### 3. Push and CI

```bash
git push origin main --follow-tags
```

This triggers the CD workflow:
- CI runs lint, typecheck, test, build
- On success, CD deploys and runs smoke tests
- On failure, investigate and fix before continuing

### 4. Create GitHub Release

Once `v{version}` is on `main` and CI is green:

1. Go to **GitHub → Releases → Draft a new release**
2. Select tag `v{version}`
3. Use `CHANGELOG.md` entry as release body
4. Attach any build artifacts if applicable
5. Publish release

### 5. Hotfix Procedure

For urgent production fixes:

```
git checkout main
git pull origin main
git checkout -b fix/critical-bug-description
# make changes
git push origin fix/critical-bug-description
# open PR, get review, merge to main
# tag new patch version
git tag -a v{old-patch + 1} -m "Hotfix: describe fix"
git push origin main --follow-tags
```

## Tagging Convention

| Tag format | Meaning |
|------------|---------|
| `v1.0.0` | Production release |
| `v1.0.0-alpha.1` | Pre-release |
| `v1.0.0-rc.1` | Release candidate |

Tags are **annotated** (`-a`) with a message. They are not signed (GPG signing optional
— configure `GPG_SIGN_TAGS=true` in `.env` if your team uses it).

## Rollback

See `docs/CI-CD.md` § Rollback Procedure.

In short:
1. Identify the bad tag / commit
2. `git revert <merge-commit>` or re-tag the previous version
3. Merge the revert — CD re-deploys
4. Investigate before re-releasing the fix

## Setup Checklist

When the first codebase is present, complete these steps:

- [ ] Initialize `CHANGELOG.md` (see format above)
- [ ] Add `bump` script to `package.json` (e.g. `standard-version` or `release-please`)
- [ ] Configure branch protection on `main` (require CI + 1 review)
- [ ] Set `GITHUB_TOKEN` secret for CD workflow (if auto-creating releases via GitHub API)
