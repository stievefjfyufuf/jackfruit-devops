import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const task = process.argv[2];
const root = process.cwd();
const evidence = join(root, 'audit-evidence');
mkdirSync(evidence, { recursive: true });

function run(command, args, outputFile) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  writeFileSync(join(evidence, outputFile), output, 'utf8');
  if (result.error) {
    console.error(`${command} could not run: ${result.error.message}`);
    process.exit(2);
  }
  return result;
}

function docker(image, args, outputFile) {
  // Docker is already a Jenkins deployment prerequisite; pin scan images for repeatable CI results.
  return run('docker', ['run', '--rm', '-v', `${root}:/src`, '-w', '/src', image, ...args], outputFile);
}

if (task === 'sast') {
  const result = docker(
    'semgrep/semgrep:1.75.0',
    ['semgrep', 'scan', '--config', 'p/javascript', '--error', '--json', '--output', 'audit-evidence/semgrep.json', '.'],
    'semgrep-console.txt'
  );
  process.exit(result.status ?? 2);
}

if (task === 'secrets') {
  // Default git mode examines reachable repository history. --redact prevents values appearing in reports/logs.
  const result = docker(
    'zricethezav/gitleaks:v8.21.2',
    ['detect', '--source', '.', '--redact', '--report-format', 'json', '--report-path', 'audit-evidence/gitleaks.json', '--exit-code', '1'],
    'gitleaks-console.txt'
  );
  process.exit(result.status ?? 2);
}

if (task === 'sca') {
  const npm = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const npmArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm.cmd audit --omit=dev --audit-level=critical --json']
    : ['audit', '--omit=dev', '--audit-level=critical', '--json'];
  const result = run(npm, npmArgs, 'npm-audit.json');
  let report;
  try { report = JSON.parse(result.stdout); } catch {
    console.error('npm audit did not return valid JSON; refusing to continue without SCA evidence.');
    process.exit(2);
  }
  const critical = Number(report.metadata?.vulnerabilities?.critical ?? 0);
  if (critical > 0) {
    console.error(`Critical dependency vulnerabilities: ${critical}. Security gate failed.`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 2);
  console.log('SCA gate passed: no Critical dependency vulnerabilities reported.');
  process.exit(0);
}

console.error('Usage: node scripts/security-scan.js <sast|secrets|sca>');
process.exit(2);
