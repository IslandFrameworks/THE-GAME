// Cloudflare Pages build, for ONE of the two sites:
//   node scripts/build-site.mjs shell   the front page (thegame-live): gate, heartbeat watcher
//   node scripts/build-site.mjs world   the world (thegame-world): engine, guard, everything contributed
// Each site gets only its own files. The repo root (machinery, lockfile, .github) is never
// published. The two addresses are stamped in here; override with SHELL_ORIGIN / WORLD_ORIGIN
// (the brick test does, to run both sites on this machine). Reads file names; never runs an entity.
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { worldScripts } from './build-manifest.mjs';

const target = process.argv[2];
if (target !== 'shell' && target !== 'world') { console.error('usage: build-site.mjs shell|world'); process.exit(2); }
const SHELL = process.env.SHELL_ORIGIN || 'https://thegame-live.pages.dev';
const WORLD = process.env.WORLD_ORIGIN || 'https://thegame-world.pages.dev';
for (const o of [SHELL, WORLD]) if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/.test(o)) throw new Error(`not an origin: ${o}`);
const stamp = (text) => text.replaceAll('__SHELL_ORIGIN__', SHELL).replaceAll('__WORLD_ORIGIN__', WORLD);
const out = process.env.OUT_DIR || 'dist';

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const copy = (f) => writeFileSync(`${out}/${f}`, stamp(readFileSync(f, 'utf8')));

if (target === 'shell') {
  for (const f of ['index.html', '404.html', 'shell.js', 'shell.css']) copy(f);
  writeFileSync(`${out}/_headers`, stamp(readFileSync('headers/shell.headers', 'utf8')));
} else {
  for (const f of ['guard.js', 'engine.js', 'game.css']) copy(f);
  writeFileSync(`${out}/404.html`, stamp(readFileSync('404.html', 'utf8')));
  for (const d of ['entities', 'assets', 'lib']) if (existsSync(d)) cpSync(d, `${out}/${d}`, { recursive: true, filter: s => !/\/\.[^/]*$/.test(s) });
  // The world's scripts, written into game.html as plain tags (a parser tag is not a Trusted Types
  // sink). Names are validated by the gatekeeper and again in worldScripts(), so they carry no markup.
  const { libs, ents } = worldScripts();
  const html = readFileSync('game.html', 'utf8');
  if (!html.includes('<!-- WORLD SCRIPTS -->')) throw new Error('game.html lost its <!-- WORLD SCRIPTS --> marker');
  writeFileSync(`${out}/game.html`, stamp(html.replace('<!-- WORLD SCRIPTS -->', [...libs, ...ents].map(p => `  <script src="${p}"></script>`).join('\n'))));
  writeFileSync(`${out}/_headers`, stamp(readFileSync('headers/world.headers', 'utf8')));
}
console.log(`${out}/ built: ${target} (shell ${SHELL}, world ${WORLD})`);
