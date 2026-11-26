# Software Bill of Materials (SBOM)

## Artifact

- Format: CycloneDX JSON 1.6
- Generator: `@cyclonedx/cyclonedx-npm` 7.0.1
- Source: locked npm dependency graph (`package-lock.json`), not the lockfile
  itself.
- Artifact: `artifacts/sbom/jackfruit-devops.cdx.json`
- Generated: 2026-11-26
- Structural validation: passed; 100 components.
- SHA-256: `C3152CBDDF21E6F8F822C7A64D689E6A5CB4466B5FB9E061D336D7DF5B914F0B`

## Reproduce and validate

```powershell
npm.cmd run sbom:generate
npm.cmd run sbom:validate
Get-FileHash artifacts\sbom\jackfruit-devops.cdx.json -Algorithm SHA256
```

Regenerate only after a dependency/lockfile change or for an approved release
candidate. The SBOM is dependency inventory, not a vulnerability-scan result.
