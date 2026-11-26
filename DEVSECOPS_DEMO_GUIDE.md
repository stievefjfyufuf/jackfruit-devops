# DevSecOps Demonstration Guide

Use this guide only with the official A1-H5 rubric in hand. The rubric wording
and weights are not in this repository, so match each assessor item to the
evidence below before calling it PASS.

## Safe demonstration boundary

- Demonstrate from `devsecops-security-audit`; do not merge or push during the
  assessment unless the assessor explicitly asks.
- Use localhost or isolated staging only. Do not use production Jenkins, VPS,
  database, credentials, or a real secret.
- Do not expose scan reports if they could contain sensitive metadata.

## Evidence sequence

1. Show branch and clean/change scope:

   ```powershell
   git branch --show-current
   git status --short
   ```

2. Show the CI controls without running them again:

   ```powershell
   Get-Content .github/workflows/security.yml
   Get-Content Jenkinsfile.security
   ```

   Explain: GitHub uses locked dependencies, full history, pinned Semgrep and
   Gitleaks containers, and a fail-closed Critical npm audit. The Jenkinsfile
   is specifically staging-only, has no deploy stage, and stops after a
   Critical SCA result.

3. Show the existing actual outcomes from the supplied evidence: GitHub
   Semgrep/Gitleaks/npm audit/11 tests passed; Jenkins Security Staging Build
   #2 succeeded; the controlled Critical-vulnerability test failed as intended.
   Open the genuine GitHub/Jenkins run pages supplied by the project owner;
   do not create substitute screenshots.

4. Demonstrate new local header coverage (safe; it changes neither database
   nor production state):

   ```powershell
   npm.cmd test
   ```

   Point to the `security response headers protect API responses...` test in
   `test/app.test.js`. It verifies CSP, `nosniff`, referrer policy, no-store on
   API responses, and hidden Express framework header.

5. Show dependency and disclosure governance:

   ```powershell
   Get-Content .github/dependabot.yml
   Get-Content SECURITY.md
   ```

   Dependabot proposes weekly reviewable updates; it cannot merge by itself.
   The disclosure policy prohibits public secrets and production testing.

6. Show IaC evidence and the new local API security coverage:

   ```powershell
   Get-FileHash audit-evidence\trivy-iac.json -Algorithm SHA256
   npm.cmd test
   ```

   The original Trivy 0.76.2 JSON report is local-only/ignored and records 20
   successful Dockerfile checks with no HIGH or CRITICAL failures. Do not claim
   Docker Compose passed: KICS is configured in the GitHub workflow and needs a
   genuine CI run. Point to the API test named `API fails closed...` for the
   tested 405, malformed content type, repeated-query, and numeric-boundary
   cases.

7. Show container hardening only by source inspection unless a separate local
   staging Docker environment is approved:

   ```powershell
   Get-Content Dockerfile
   Get-Content docker-compose.yml
   ```

   Identify non-root runtime, dropped capabilities, `no-new-privileges`,
   loopback default port binding, healthcheck, and named persistent volume.

8. Show the audit record and change boundary:

   ```powershell
   Get-Content DEVSECOPS_PROGRESS_FINAL.md
   Get-Content docs/software-engineering/changes/CR-001.md
   ```

9. Demonstrate release governance without creating a release:

   ```powershell
   npm.cmd run sbom:validate
   Get-Content docs/RELEASE_SECURITY_ASSESSMENT.md
   Get-Content docs/VULNERABILITY_REGISTER.md
   Get-Content docs/INCIDENT_RESPONSE_RUNBOOK.md
   Get-Content CHANGELOG.md
   ```

   Show that the SBOM is CycloneDX inventory rather than `package-lock.json`.
   The release assessment must remain NO-GO until the listed blockers are
   cleared by real evidence and the owner records approval. No Git tag is
   created by these steps.

## Assessor handoff

For each A1-H5 item, record the official wording, weight, exact command/run
URL, timestamp, and observed outcome. Change only the associated row from
`PARTIAL` or `UNVERIFIED` to `PASS` once the criterion is demonstrated. Keep
BLOCKED items blocked when required infrastructure is unavailable.
