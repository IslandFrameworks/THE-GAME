// Cloudflare Pages build: the manifest, then ONLY the site's files into dist/. The repo root (the
// machinery, the lockfile, .github) is never published. Reads file names; never runs an entity.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
execFileSync('node', ['scripts/build-manifest.mjs'], { stdio: 'inherit' });
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of ['index.html', 'shell.js', 'shell.css', 'game.html', 'game.css', 'engine.js', 'manifest.js', '_headers']) cpSync(f, `dist/${f}`);
for (const d of ['entities', 'assets']) if (existsSync(d)) cpSync(d, `dist/${d}`, { recursive: true, filter: s => !/\/\.[^/]*$/.test(s) });
console.log('dist/ built');
