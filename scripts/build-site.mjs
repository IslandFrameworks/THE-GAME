// Cloudflare Pages build: ONLY the site's files into dist/. The repo root (the machinery, the
// lockfile, .github) is never published. Reads file names; never runs an entity.
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { worldScripts } from './build-manifest.mjs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of ['index.html', '404.html', 'guard.js', 'shell.js', 'shell.css', 'game.css', 'engine.js', '_headers']) cpSync(f, `dist/${f}`);
for (const d of ['entities', 'assets', 'lib']) if (existsSync(d)) cpSync(d, `dist/${d}`, { recursive: true, filter: s => !/\/\.[^/]*$/.test(s) });
// The world's scripts, written into game.html as plain tags. Names are validated by the gatekeeper
// and again by the regexes in worldScripts(), so they cannot carry markup.
const { libs, ents } = worldScripts();
const tags = [...libs, ...ents].map(p => `  <script src="${p}"></script>`).join('\n');
const html = readFileSync('game.html', 'utf8');
if (!html.includes('<!-- WORLD SCRIPTS -->')) throw new Error('game.html lost its <!-- WORLD SCRIPTS --> marker');
writeFileSync('dist/game.html', html.replace('<!-- WORLD SCRIPTS -->', tags));
console.log(`dist/ built: ${libs.length} lib, ${ents.length} entities`);
