// The gatekeeper. Runs on every PR with NO write access; a separate workflow merges only if this
// passed. Usage: node scripts/check-pr.mjs <base-sha> <head-sha>
//
// Enforced here: the Law of Conservation (no deletions, no renames, no edits to existing lines),
// the habitat (only entities/ and assets/), asset size, entity naming. The API lint is a courtesy
// that fails fast with a clear message; the real sandbox is the CSP in _headers, which the browser
// enforces however cleverly a call is disguised.
import { execFileSync } from 'node:child_process';

const [base, head] = process.argv.slice(2);
if (!base || !head) { console.error('usage: check-pr.mjs <base> <head>'); process.exit(2); }
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 << 20 });
const range = `${base}...${head}`;
const problems = [];

// THE WORLD: everything that runs INSIDE the sandbox, open to anyone, add-only. Everything else is
// the cage (index.html holds the sandbox attribute, _headers holds the CSP, the workflows and these
// scripts hold the checks) or the law, and stays with the Keepers. Growing the world cannot reach
// outside it: world code runs in <iframe sandbox="allow-scripts"> under a CSP with no network.
const WORLD = /^(entities\/|assets\/|lib\/|engine\.js$|game\.html$|game\.css$)/;

// Every changed path and how it changed. A = added, M = modified, D/R/C/T = forbidden outright.
const status = git('diff', '--name-status', '-M', range).trim().split('\n').filter(Boolean)
  .map(l => { const [s, ...p] = l.split('\t'); return { s, path: p[p.length - 1], from: p[0] }; });
if (status.length === 0) problems.push('The PR changes nothing.');

for (const { s, path, from } of status) {
  if (s.startsWith('D')) problems.push(`${path}: deleted. The Law of Conservation forbids deletion.`);
  else if (s.startsWith('R')) problems.push(`${from} -> ${path}: renamed. A rename deletes the old name.`);
  else if (!['A', 'M'].includes(s)) problems.push(`${path}: change type ${s} is not allowed.`);
  if (!WORLD.test(path)) problems.push(`${path}: part of the cage or the law. The world (engine.js, game.html, game.css, entities/, assets/, lib/) is yours to build on; the files that keep it safe belong to the Keepers.`);
  if (/^entities\//.test(path) && !/^entities\/\d{4}-[a-z0-9-]+\.js$/.test(path)) problems.push(`${path}: entity files are named NNNN-short-name.js.`);
  if (/^lib\//.test(path) && !/^lib\/[a-z0-9-]+\.js$/.test(path)) problems.push(`${path}: lib files are named short-name.js (lowercase, hyphens).`);
}

// Only ordinary files. A symlink (mode 120000) could point at machinery or at the build machine's
// own files; a submodule (160000) pulls in a whole other repository. Both are refused outright.
for (const line of git('diff', '--raw', '--no-abbrev', range).trim().split('\n').filter(Boolean)) {
  const m = /^:(\d{6}) (\d{6}) \S+ \S+ \S+\t(.+)$/.exec(line);
  if (m && m[2] !== '100644' && m[2] !== '000000') problems.push(`${m[3].split('\t').pop()}: file mode ${m[2]}. Only ordinary files are allowed (no symlinks, submodules or executables).`);
}

// Size of one PR. A world that grows forever still grows one reasonable step at a time.
if (status.length > 20) problems.push(`${status.length} files in one PR. The limit is 20.`);
let addedBytes = 0;
for (const { s, path } of status) if (s === 'A' || s === 'M') { try { addedBytes += Number(git('cat-file', '-s', `${head}:${path}`).trim()); } catch {} }
if (addedBytes > 5 * 1024 * 1024) problems.push(`${(addedBytes / 1048576).toFixed(1)} MB in one PR. The limit is 5 MB.`);

// Line-level conservation. numstat reports an edited line as one deletion plus one addition, so
// "deletions > 0" also catches any change to an existing line. Binary files report "-".
for (const line of git('diff', '--numstat', range).trim().split('\n').filter(Boolean)) {
  const [add, del, path] = line.split('\t');
  if (del !== '-' && Number(del) > 0) problems.push(`${path}: ${del} line(s) removed or changed. Existing lines are permanent; add new code that overrides them instead.`);
  if (add === '-' && /^assets\//.test(path)) {
    const bytes = Number(git('cat-file', '-s', `${head}:${path}`).trim());
    if (bytes > 2 * 1024 * 1024) problems.push(`${path}: ${(bytes / 1048576).toFixed(1)} MB. Assets are 2 MB at most.`);
  }
}
for (const { s, path } of status) {
  if (s === 'A' && /^assets\//.test(path)) {
    const bytes = Number(git('cat-file', '-s', `${head}:${path}`).trim());
    if (bytes > 2 * 1024 * 1024 && !problems.some(p => p.startsWith(path))) problems.push(`${path}: ${(bytes / 1048576).toFixed(1)} MB. Assets are 2 MB at most.`);
  }
}

// Courtesy lint over ADDED lines of scripts. Fails fast with a clear reason; the CSP is the wall.
const FORBIDDEN = [
  [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|RTCPeerConnection/, 'network access (blocked by the page CSP anyway)'],
  [/\beval\s*\(|new\s+Function\s*\(|\bimport\s*\(|importScripts/, 'dynamic code loading (blocked by the page CSP anyway)'],
  [/WebAssembly/, 'WebAssembly (the classic crypto-miner vehicle)'],
  [/localStorage\.clear|indexedDB\.deleteDatabase|document\.cookie/, 'wiping or reading visitor storage'],
  [/window\.open\s*\(|location\s*=|location\.(href|replace|assign)/, 'navigating the visitor away'],
];
const patch = git('diff', '-U0', range, '--', 'entities', 'lib', 'engine.js', 'game.html');
let file = '';
for (const l of patch.split('\n')) {
  if (l.startsWith('+++ ')) { file = l.slice(6); continue; }
  if (!l.startsWith('+') || l.startsWith('+++')) continue;
  for (const [re, why] of FORBIDDEN) if (re.test(l)) problems.push(`${file}: ${why}: ${l.slice(1).trim().slice(0, 80)}`);
}

if (problems.length) {
  console.log(`REJECTED (${problems.length}):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(`ACCEPTED: ${status.length} file(s) added or extended, nothing removed.`);
