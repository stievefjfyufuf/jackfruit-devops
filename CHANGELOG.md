# Changelog

All notable repository changes are listed from actual commit history. Dates use
the Git commit date. No Git release tag is created or implied by this file.

## Unreleased

### Security and audit improvements

- 2026-11-26 `4b264c3` - Added IaC scans, API security tests, OWASP evidence,
  and DevSecOps audit documentation.
- 2026-11-26 `a2489e8` - Corrected the Jenkins Node.js version-check regex.
- 2026-11-26 `df9938a` - Added security CI validation, SAST, secret scanning,
  and dependency-audit gates.

### Earlier CI/CD history

- 2026-11-03 `fdaa406`, `de4c5a5` - Updated CI/CD presentation display.
- 2026-11-03 `aadc1ed`, `b53d65c`, `5e410a2` - Added Jenkins deployment/polling
  verification changes.
- 2026-10-29 `f1c1102`, `7480327`, `6a08ccc` - Added and corrected secure SCM
  polling and deployment branch validation.
- 2026-10-29 `cf72ec3` - Initial Jack Fruit DevOps inventory implementation.

## Release process note

Create a tag only after the project owner approves a GO decision in
`docs/RELEASE_SECURITY_ASSESSMENT.md`. This changelog is not a release tag.
