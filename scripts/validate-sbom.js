import { readFileSync } from 'node:fs';

const path = process.argv[2] || 'artifacts/sbom/jackfruit-devops.cdx.json';
let bom;
try {
  bom = JSON.parse(readFileSync(path, 'utf8'));
} catch (error) {
  console.error(`SBOM is not readable JSON: ${error.message}`);
  process.exit(2);
}
if (bom.bomFormat !== 'CycloneDX' || !/^1\.[5-6]$/.test(String(bom.specVersion)) || !bom.metadata?.component || !Array.isArray(bom.components)) {
  console.error('SBOM failed structural validation: expected CycloneDX 1.5/1.6 metadata component and components array.');
  process.exit(1);
}
console.log(`Validated CycloneDX ${bom.specVersion} SBOM: ${bom.components.length} components in ${path}`);
