# Code Review

## Scope

ISSUE-001 / REQ-001–003 / AC-001–003. Self-review against the saved design baseline, implementation notes, runtime files, tests and deployment definitions. No independent reviewer was invoked.

## Findings

FINDING-001 [P2, fixed] Jenkinsfile Install stage: nested shell/JavaScript quote escaping could invalidate the Node version gate after Groovy parsing. Replaced with an Ubuntu-compatible version output check (`node --version | grep -E "^v22[.]"`). The full pipeline still requires execution in Jenkins for validation.

FINDING-002 [P3, fixed] package.json test script: implicit test discovery could include scratch copies under work/. Explicitly select `test/app.test.js` so local scratch material cannot change the deterministic suite.

FINDING-003 [P3, fixed] public/app.js: sidebar release indicator was static. Refresh it from the live health response so version demonstrations remain consistent.

## Missing Tests / Verification Limits

Docker build, Compose schema/runtime, Linux native addon installation, Jenkins declarative parsing and live VPS health checks require unavailable infrastructure. They were source-reviewed, not executed. API product CRUD is automated; browser checks focused on rendering, create, search, out-of-stock rejection, successful issue, alerts, history, health and mobile navigation. No claim of exhaustive browser automation.

## Security / Data Risks

No authentication is included as requested. Default loopback binds and SSH tunnel instructions restrict the demo. Quantity changes and history are atomic, and tests never use the production path. A fixed named volume survives container replacement. Pipeline failure after deployment does not imply automatic rollback; recovery and backups are documented. Deployment branches must be trusted because Jenkins Docker access is privileged.

## Decision

Approve with notes for the local university demonstration. Local AC-001/002 checks passed. AC-003 deployment files are prepared, with Docker/Jenkins/VPS execution pending on the target host. See outputs/VERIFICATION.md for actual run results.
