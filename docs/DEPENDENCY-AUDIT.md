# Dependency Audit

## Status

**Blocked**: No codebase present — tech stack not yet chosen.
This document will be completed once the project has a `package.json`, `Cargo.toml`, `go.mod`, or equivalent dependency manifest.

## Planned Audit Steps

When the codebase is available, the following will be performed:

### 1. Inventory
- [ ] List all direct and transitive dependencies
- [ ] Record version, license, and last-updated date

### 2. Vulnerability Scan
- [ ] Run `npm audit` / `cargo audit` / `go mod verify`
- [ ] Check NVD / OSV database for known CVEs
- [ ] Flag any dependencies with >0 known vulnerabilities

### 3. Staleness Check
- [ ] Identify dependencies with major versions behind current
- [ ] Identify abandoned / deprecated packages
- [ ] Check for packages superseded by stdlib or language features

### 4. License Compliance
- [ ] Flag non-permissive licenses (GPL, AGPL, EUPL) in production deps
- [ ] Verify all dependencies have compatible licenses for commercial use

### 5. Upgrade Plan

Prioritization:
1. **Critical** — packages with known exploitable vulnerabilities
2. **High** — packages with known security advisories
3. **Medium** — packages 2+ major versions behind current
4. **Low** — packages 1 major version behind, or deprecated

### Dependency Health Targets

| Metric            | Target   |
|-------------------|----------|
| Known CVEs        | 0        |
| Outdated majors   | 0        |
| Deprecated pkgs   | 0        |
| GPL in prod       | 0        |

## Known Actions Once Stack is Chosen

- **Node.js/TypeScript**: Use `npm audit`, `npm outdated`, `ncu`
- **Python**: Use `pip-audit`, `pip-check-reqs`, `pyup`
- **Go**: Use `go mod tidy && go mod verify`, `govulncheck`
- **Rust**: Use `cargo audit`, `cargo outdated`
