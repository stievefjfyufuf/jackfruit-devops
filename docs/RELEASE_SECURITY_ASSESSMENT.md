# Pre-release Security Assessment

## Release candidate

Branch: `devsecops-security-audit`
Release tag: none - no tag is created by this assessment.
Decision owner: project owner / course assessor.

## GO/NO-GO rule

The decision is **GO** only when every mandatory row is `GO`, evidence is
genuine and traceable to its execution, and the owner records approval. Any
`NO-GO`, `BLOCKED`, or missing mandatory evidence means **NO-GO**. A document
alone never changes the decision.

| Mandatory control | Evidence required | Current evidence | Gate |
|---|---|---|---|
| Automated API tests | Current test output, 0 failures | CR-002: `npm.cmd test`, 13 PASS / 0 FAIL | GO for last code change |
| SAST | Genuine Semgrep run result | User-provided GitHub Actions SUCCESS; run URL/ID not stored here | GO pending owner retention |
| Secret scan | Genuine Gitleaks run result | User-provided GitHub Actions SUCCESS; run URL/ID not stored here | GO pending owner retention |
| Dependency SCA | Genuine npm audit run result, no Critical | User-provided GitHub Actions SUCCESS; Jenkins Security Staging Build #3 SUCCESS | GO pending owner retention |
| IaC: Dockerfile | Trivy JSON with no release-blocking finding | CR-002 Trivy 0.76.2: 0 HIGH/CRITICAL, 20 successes | GO for Dockerfile only |
| IaC: Compose | Genuine KICS result | KICS configured but no executed evidence in workspace | BLOCKED |
| SBOM | Valid CycloneDX or SPDX artifact and checksum | CycloneDX 1.6, 100 components; SHA-256 `C3152CBDDF21E6F8F822C7A64D689E6A5CB4466B5FB9E061D336D7DF5B914F0B` | GO for SBOM artifact |
| Vulnerability triage | Register reviewed; no unresolved Critical/High accepted without owner exception | Register contains no actual finding; medium/low not assessed by available scans | BLOCKED |
| Release approval | Named owner, date, decision | Not recorded | BLOCKED |

## Current decision

**NO-GO.** The Docker Compose IaC result, severity coverage, and explicit owner
approval are pending. This is intentionally conservative and
does not negate earlier successful CI/Jenkins results.

## Decision record

| Date | Owner | Decision | Evidence reference | Notes |
|---|---|---|---|---|
| Pending | Unassigned | NO-GO | This assessment | No person is assigned automatically. |
