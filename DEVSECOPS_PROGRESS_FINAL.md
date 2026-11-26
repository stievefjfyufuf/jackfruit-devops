# DevSecOps Final Audit Progress

Last updated: 2026-11-26 (Australia/Perth)
Branch inspected: `devsecops-security-audit`
Scope: repository only; no push, merge, production Jenkins, VPS, or production
database action was performed.

## Evidence rules

The official A1-H5 rubric PDF is not present in this workspace. Therefore **Weight** is recorded as `Not supplied`, and an item is
never marked PASS merely because a similarly named control exists. `PASS` is
reserved for an explicitly supplied/observed outcome whose rubric mapping is
unambiguous; `PARTIAL` means supporting implementation exists but assessor
criteria or an execution environment is still required; `UNVERIFIED` means the
criterion wording is unavailable. Supply the official checklist to replace the
placeholder requirement labels and calculate a score without inventing one.

Evidence references are real repository paths or results stated in the task;
they are not screenshots or generated scan claims.

## 43-item ledger

| ID | Weight | Status | Available evidence / current gap | Remaining work |
|---|---:|---|---|---|
| A1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| A2 | Not supplied | PARTIAL | Current branch confirmed as `devsecops-security-audit`; `.gitignore` protects common secret/data paths. | Assessor map/verify A2 requirement. |
| A3 | Not supplied | PARTIAL | `.github/workflows/security.yml` has least-privilege `contents: read`; full-history checkout. | Execute/inspect against rubric wording. |
| A4 | Not supplied | PARTIAL | `SECURITY.md` defines private reporting and non-production test boundary. | Assessor review and any required contact channel. |
| B1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B2 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B4 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B5 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B6 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B7 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| B8 | Not supplied | PARTIAL | GitHub workflow runs `npm ci`, `npm test`, Semgrep, Gitleaks, and npm Critical gate; reported GitHub Actions pass is preserved as user-provided evidence. | Provide rubric wording and workflow run URL/ID. |
| C1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| C2 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| C3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| C4 | 3% (user-supplied) | PARTIAL | Local Trivy 0.76.2 Dockerfile scan executed: 20 successes, 0 HIGH/CRITICAL failures; raw JSON at ignored `audit-evidence/trivy-iac.json` (SHA-256 `4C29A74DC90B49ADB1CFAED7560451727F527104F364A40BE1BF699F2ACBB994`). CI now has pinned KICS v2.2.1 Compose scan. | KICS has not executed locally (Docker/KICS unavailable) or in a new CI run; retain genuine CI output. |
| C5 | Not supplied | PASS | User-provided result: Jenkins Security Staging Build #2 SUCCESS and the controlled one-Critical-vulnerability negative run FAILED. | Retain console evidence; do not rerun without a change. |
| D1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| D2 | 3% (user-supplied) | PARTIAL | New API tests cover PATCH/POST method rejection (405), `Allow`, non-JSON body, repeated query, numeric Infinity/limit/offset/product bounds, and state preservation. | Execute controlled localhost DAST only if an isolated staging target is available. |
| D3 | 3% (user-supplied) | PARTIAL | [OWASP matrix](docs/OWASP_TOP10_TEST_MATRIX.md) maps source and 13 real local tests; categories without tests are BLOCKED/NOT PASS. | Threat model, controlled DAST, TLS and security-event logging evidence as applicable. |
| E1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| E2 | Not supplied | PARTIAL | SAST is pinned Semgrep 1.75.0, fail-on-findings, JSON evidence; user reports PASS. | Preserve CI run URL/console and map rubric. |
| E3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| E4 | Not supplied | PARTIAL | Gitleaks 8.21.2 scans full reachable history with redaction; user reports PASS. | Preserve CI run URL/console and map rubric. |
| E5 | Not supplied | PARTIAL | npm audit Critical gate plus weekly Dependabot for npm/GitHub Actions. | Show first Dependabot PR or configured repository page; map rubric. |
| F1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| F2 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| F3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| F4 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| F5 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G1 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G2 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G4 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G5 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G6 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G7 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| G8 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| H1 | Not supplied | PARTIAL | `docs/DEVSECOPS-VALIDATION.md`, `SECURITY.md`, and this ledger document controls/limits. | Map rubric wording; assessor review. |
| H2 | Not supplied | PARTIAL | `DEVSECOPS_DEMO_GUIDE.md` gives repeatable evidence steps and boundaries. | Run only required demo steps with assessor. |
| H3 | Not supplied | UNVERIFIED | Official requirement text absent. | Map rubric text and test. |
| H4 | Not supplied | PARTIAL | `SECURITY.md` and Dependabot configuration define reporting/update governance. | Assessor confirms rubric fit. |
| H5 | Not supplied | PARTIAL | CR-001 records scope, risks, verification, and rollback; no production changes. | Assessor confirms rubric fit. |

## Recorded test evidence

| Source | Result | Qualification |
|---|---|---|
| User-provided baseline | Semgrep SAST, Gitleaks, npm audit, and 11 automated tests PASS | Preserved; intentionally not rerun before a relevant change. |
| User-provided baseline | Jenkins Security Staging Build #2 SUCCESS | Preserved; staging only. |
| User-provided negative test | One simulated Critical vulnerability caused Jenkins C5 failure | Expected fail-closed behavior. |
| CR-001 | `npm.cmd test` PASS: 12 tests, 0 failures, 26 Nov 2026 | Includes the response-header test. |
| CR-002 | `npm.cmd test` PASS: 13 tests, 0 failures, 26 Nov 2026 | Includes newly added API method/input/boundary coverage. |
| CR-002 | Trivy 0.76.2 config scan executed locally | Dockerfile: 20 successful checks, 0 HIGH/CRITICAL failures. Raw JSON is retained in ignored `audit-evidence/`. |

## Known blocks

- Exact official checklist descriptions and weights cannot be transcribed safely until the attached PDF is made available inside this workspace. User supplied only C4/D2/D3 weights (3% each).
- Docker, KICS, GitHub-hosted runner, and Jenkins agent execution are not available as local evidence in this task. They remain BLOCKED, not failed or passed.
- No scan report is committed: `audit-evidence/` remains ignored to avoid retaining sensitive finding metadata.
