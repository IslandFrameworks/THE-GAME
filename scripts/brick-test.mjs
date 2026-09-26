// The brick test. Boots the world AS IT WOULD BE after merging, THE REAL WAY (front page, Enter,
// the sandboxed frame, every _headers rule applied per path exactly as Cloudflare does), and fails
// if the world stops living for everyone:
//   - it navigates away, or never loads
//   - it stops advancing (an endless loop; evaluate never returns)
//   - it crawls (below 10 frames per second)
//   - it balloons (over 512 MB of JavaScript heap)
// Runs ONLY in the workflow's zero-permission job: the one place contributed code executes holds no
// token scopes and no secrets. Usage: node scripts/brick-test.mjs [--chrome /path]
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const root = process.cwd();
const argv = process.argv.slice(2);
const chrome = argv.includes('--chrome') ? argv[argv.indexOf('--chrome') + 1]
  : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
if (!chrome) { console.error('brick-test: no Chrome found (pass --chrome).'); process.exit(2); }

execFileSync('node', ['scripts/build-site.mjs'], { cwd: root, stdio: 'inherit' });
const site = path.join(root, 'dist');

// _headers, parsed the way Pages applies it: every block whose pattern matches contributes, and a
// header named in several blocks is sent several times (browsers enforce every CSP they receive).
const blocks = [];
for (const line of readFileSync(path.join(site, '_headers'), 'utf8').split('\n')) {
  if (/^\//.test(line)) blocks.push({ re: new RegExp('^' + line.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), headers: [] });
  else if (/^  [A-Za-z-]+: /.test(line) && blocks.length) { const i = line.indexOf(': '); blocks.at(-1).headers.push([line.slice(2, i), line.slice(i + 2)]); }
}
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const srv = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  if (!path.extname(rel) && existsSync(path.join(site, rel + '.html'))) rel += '.html'; // Pages serves /game for game.html
  const p = path.join(site, rel);
  if (!p.startsWith(site + path.sep) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  const out = {};
  for (const b of blocks) if (b.re.test(url)) for (const [k, v] of b.headers) (out[k] ??= []).push(v);
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream', ...out });
  res.end(readFileSync(p));
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${srv.address().port}`;

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
const problems = [];
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  await withTimeout(page.goto(`${origin}/`), 10_000).catch(e => problems.push(`the front page did not load: ${e.message}`));
  await withTimeout(page.click('#enter'), 5000).catch(e => problems.push(`could not enter: ${e.message}`));
  await new Promise(r => setTimeout(r, 1500));
  const world = () => page.frames().find(f => f !== page.mainFrame());
  const frameAt = () => withTimeout(world().evaluate(() => (window.THE_GAME ? window.THE_GAME.frame : -1)), 3000);
  const a = await frameAt().catch(() => null);
  await new Promise(r => setTimeout(r, 2000));
  const b = await frameAt().catch(() => null);
  const heapMB = await withTimeout(page.metrics(), 3000).then(m => m.JSHeapUsedSize / 1048576).catch(() => null);
  const topUrl = page.url();
  const frameUrl = world()?.url() ?? '';
  if (!topUrl.startsWith(origin)) problems.push(`the page navigated away (${topUrl.slice(0, 80)}).`);
  else if (!frameUrl.startsWith(origin)) problems.push(`the world navigated away (${frameUrl.slice(0, 80)}).`);
  else if (a === null || b === null) problems.push('the world stopped responding: something is blocking the main thread (an endless loop?).');
  else if (a < 0) problems.push('THE_GAME never started.');
  else if (b - a < 20) problems.push(`the world crawls: ${b - a} frames in 2s (the floor is 20, i.e. 10 fps).`);
  if (heapMB !== null && heapMB > 512) problems.push(`the world uses ${heapMB.toFixed(0)} MB of memory (the ceiling is 512 MB).`);
  if (!problems.length) console.log(`brick-test: alive, ${b - a} frames in 2s, ${heapMB?.toFixed(0) ?? '?'} MB heap.`);
} finally {
  await browser.close().catch(() => {});
  srv.close();
}
if (problems.length) {
  console.log('BRICKED:');
  for (const p of problems) console.log(`  - ${p}`);
  console.log('An entity that stops the world for everyone cannot be answered by a countermeasure, so it cannot merge.');
  process.exit(1);
}
