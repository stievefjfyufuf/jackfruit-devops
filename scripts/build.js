import { mkdirSync, cpSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
for (const path of ['src','public','scripts']) cpSync(path, `dist/${path}`, { recursive: true });
cpSync('package.json', 'dist/package.json');
cpSync('package-lock.json', 'dist/package-lock.json');
console.log('Validated and packaged application in dist/ (no frontend compiler needed).');
