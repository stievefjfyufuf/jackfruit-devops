# Security Policy

## Supported version

Security fixes are made on the current `devsecops-security-audit` branch and
are reviewed before being merged into `main`.

## Reporting a vulnerability

Do not put a secret, exploit payload, or production endpoint in a public Git
issue. For this university project, report the finding privately to the project
maintainer or course instructor with:

- affected commit SHA and component/path;
- minimal non-sensitive reproduction steps;
- impact and any mitigation already applied.

The maintainer should acknowledge the report, reproduce it only in localhost
or isolated staging, record remediation, and disclose it only after a fix is
available. Production services, credentials, and data are out of scope for
student testing.

## Security controls

Pull requests and pushes to the audit branch run the locked-dependency test
suite, Semgrep SAST, Gitleaks history scan, and npm Critical-vulnerability
gate. Dependabot opens reviewable update pull requests weekly. Scan reports are
ephemeral CI artifacts and must not be committed because findings may contain
sensitive metadata.
