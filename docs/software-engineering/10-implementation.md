# Implementation Notes

## Issue

ISSUE-001 implements REQ-001–003 / AC-001–003 from the user's complete inventory and DevOps brief. Design and API baseline is recorded in documents 06–09 in this directory.

## Files Changed

- `src/database.js`: persistent SQLite schema, constraints, seed-once marker and sample opening movements.
- `src/app.js`: validated REST API, atomic balance/history changes, health probe, security headers and JSON errors.
- `src/server.js`: environment configuration, startup and graceful shutdown.
- `public/`: responsive vanilla dashboard, product/movement dialogs, filtering, history, alerts and health monitor.
- `test/app.test.js`: isolated temporary-database HTTP integration suite.
- `scripts/`: syntax-validated runtime packaging and executable HTTP health check.
- `package.json`, lockfile and `.nvmrc`: reproducible dependencies, scripts and Node 22 target.
- `Dockerfile`, Compose, ignore files and `Jenkinsfile`: non-root image, persistent volume and test-gated deployment.
- `README.md`: local Windows, Ubuntu VPS, GitHub/Jenkins and demonstration instructions.

## Approach

Single Express process and local SQLite database. No authentication, framework compiler, external API or account configuration. Product metadata replacement cannot bypass movement history. Immediate database transactions serialize competing stock writes. SQL constraints provide additional balance bounds; product snapshots survive deletion.

## Behavior Implemented

API-001 / UI-001–004 / AC-001: product CRUD, configurable minimums, search/category/status filtering, opening stock, stock movements, nonnegative enforcement, paginated transaction history. UI-005 / API-003 / AC-002: periodic health monitor showing API/database state, version, response time and uptime. AC-003: local-first launch, environment variables, persistent Docker deployment and declarative pipeline.

## Migration/Config Changes

Schema created idempotently on startup; no existing database was present. A one-time initialization marker prevents deleted samples from reappearing. Default database path is `data/inventory.sqlite`; tests ignore it. Compose volume is explicitly named `jack-fruit-devops-data`. Pipeline never deletes volumes. Deployment requires enabling the parameter and matching the multibranch branch name.

## Manual Verification

11 integration tests passed on Windows Node 24.13.0 and in an isolated Node 22.23.4 copy with separately installed native modules. Syntax checks/build passed; live HTTP health check returned healthy version 1.0.0. Desktop and 390px mobile browser inspection confirmed working navigation, rendering, product creation, insufficient-stock error, successful stock-out, updated low-stock status, SKU search, history and health dashboard. Browser console had no captured errors/warnings after the final reload. Preview used `work/preview.sqlite`, never the default production path.

See `outputs/VERIFICATION.md` for the final command results and limitations. Screenshots are in outputs. Initial npm attempts failed due to restricted DNS and a concurrent installer filesystem error; installation succeeded after granting network permission and using one installer with a workspace-local cache.

## Risks

Docker/Compose, Jenkins and Ubuntu deployment could not execute on this Windows host because Docker and Jenkins are absent and no VPS credentials were supplied. Their files received source review only. No remote resources were created. No authentication is intentionally included; default loopback binding and SSH tunnel instructions suit the demo. Deployment failure does not automatically roll back an image; retained tags and backup instructions are documented. One SQLite app deployment is supported.
