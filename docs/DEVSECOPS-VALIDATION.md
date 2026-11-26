# DevSecOps validation notes

## Scope

`Jenkinsfile.security` is a staging-only Windows pipeline. It uses the
`windows-security` label, `bat` steps, a full Git-history guard, `npm ci`,
tests, and the Critical `npm audit` gate. It deliberately has no build,
deployment, Docker Compose, or production credential stage.

GitHub Actions runs on Linux with `fetch-depth: 0`. Semgrep 1.75.0 and
Gitleaks 8.21.2 are pinned Docker images. Both write JSON evidence and fail
on scanner findings or execution errors. Gitleaks scans reachable Git history
and redacts detected values. `npm audit` preserves its exit code and rejects
invalid JSON. Reports are not uploaded or committed.

## Local limitations

The Windows host can validate Node scripts and run application tests, but
cannot prove GitHub-hosted runners, Docker-based scanners, or a Jenkins agent.
Those gates must be run after the workflow is pushed and after a Jenkins agent
with Git, Node.js 22, npm, and the `windows-security` label is configured.
No generated `audit-evidence/` is tracked.
