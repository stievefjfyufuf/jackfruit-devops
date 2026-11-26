# OWASP Top 10 2021 Evidence Matrix

Date: 2026-11-26. Scope is the localhost Express API and repository source.
This is an evidence matrix, not a claim that every OWASP category has passed.

| OWASP category | Code / test evidence | Actual result | Status and remaining work |
|---|---|---|---|
| A01 Broken Access Control | Cross-origin browser writes are rejected in `src/app.js`; test asserts foreign Origin receives 403. Unsupported verbs now receive 405. | `npm.cmd test`: PASS (13/13). | PARTIAL. No authentication/role authorization exists; endpoint authorization cannot be claimed. |
| A02 Cryptographic Failures | No passwords, tokens, or PII are stored by this app; `.gitignore` excludes common credential files. | No TLS transport test executed. | BLOCKED for TLS/certificate verification; only loopback/local scope tested. |
| A03 Injection | SQL uses bound parameters in `src/app.js`; strict allow-lists/type checks reject unsupported fields and malformed values. | Existing invalid-input tests PASS. | PARTIAL. Add a dedicated injection payload suite or controlled DAST before claiming full coverage. |
| A04 Insecure Design | Atomic stock transaction and non-negative balance rule are covered by rollback/concurrency tests. | `npm.cmd test`: PASS (13/13). | PARTIAL; threat-model review is not performed. |
| A05 Security Misconfiguration | CSP, `nosniff`, referrer policy, hidden framework header, and API no-store policy are asserted by test. Trivy Dockerfile report has 20 successes/0 HIGH-CRITICAL failures. | Header test and local Trivy scan PASS. | PARTIAL. Docker Compose scanner KICS is configured but has not executed. |
| A06 Vulnerable and Outdated Components | Locked dependency install; npm Critical audit is a GitHub/Jenkins gate. | Prior user-provided npm audit PASS; not rerun because dependency set did not change. | PARTIAL; retain genuine CI console/run evidence. |
| A07 Identification and Authentication Failures | Application deliberately has no login/authentication. | Not applicable to a non-authenticated demo API, but no authentication control was tested. | NOT PASS. Do not expose publicly without adding authentication/authorization. |
| A08 Software and Data Integrity Failures | `npm ci`, lockfile, pinned scanner versions, and Dependabot configuration exist. | Source-reviewed; no signed artifact/provenance verification run. | PARTIAL. Run CI and retain workflow evidence. |
| A09 Security Logging and Monitoring Failures | Health endpoint and Jenkins/GitHub logs exist. | No security-event logging/alert test run. | BLOCKED. Design and test security event logging before claiming coverage. |
| A10 Server-Side Request Forgery | API source has no endpoint that fetches user-supplied URLs. | Source review only. | PARTIAL. If outbound URL fetching is added, add SSRF allow-list tests. |

## Reproducible local commands

```powershell
npm.cmd test
# Original Trivy output exists at audit-evidence/trivy-iac.json.
# Do not run DAST outside localhost or isolated staging.
```
