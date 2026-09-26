// The brick test. Boots the world AS IT WOULD BE after merging, THE REAL WAY (front page, Enter,
// the sandboxed frame, every _headers rule applied per path exactly as Cloudflare does), and fails
// if the world stops living for everyone:
//   - it navigates away, or never loads
//   - it stops advancing (an endless loop; evaluate never returns)
//   - it crawls (below 10 frames per second)
//   - it balloons (over 512 MB of JavaScript heap)
//   - the guard's protections no longer hold afterwards (WebRTC back, a link/anchor/frame/meta/form
//     in the page, or the element lock replaced): whatever route a creature took around the guard
//     breaks one of these. (A network-log detector was tried and dropped: even with Chrome's
//     background networking off, its own traffic to Google by IP made every PR fail.)
// It PLAYS for ~10s (arrow keys, space, letters, clicks across the canvas), sampling the frame
// counter as it goes, so a freeze triggered by input or after a few seconds is caught too.
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
  // A world frozen mid-input can drop out of Chrome's frame list entirely; that is a freeze, not a
  // crash of this test.
  const inWorld = (fn) => { const w = world(); return w ? withTimeout(w.evaluate(fn), 3000) : Promise.reject(new Error('the world frame is gone')); };
  const frameAt = () => inWorld(() => (window.THE_GAME ? window.THE_GAME.frame : -1));
  // Play: every second, some input, then check the world moved since the last check.
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'a', 'w', 's', 'd', 'e', 'q', 'Escape'];
  let prev = await frameAt().catch(() => null);
  if (prev === null) problems.push('the world stopped responding before anything was pressed.');
  else if (prev < 0) problems.push('THE_GAME never started.');
  for (let t = 1; t <= 10 && !problems.length; t++) {
    try {
      await page.keyboard.press(keys[t % keys.length]);
      await page.mouse.click(80 + (t * 67) % 600, 60 + (t * 41) % 400);
    } catch { /* input can fail once the world is gone; the frame check below says why */ }
    await new Promise(r => setTimeout(r, 1000));
    const now = await frameAt().catch(() => null);
    const frameUrl = world()?.url() ?? '';
    if (!page.url().startsWith(origin)) { problems.push(`the page navigated away (${page.url().slice(0, 80)}).`); break; }
    if (!world()) { problems.push(`the world froze at ${t}s, after input (its frame stopped responding).`); break; }
    if (!frameUrl.startsWith(origin)) { problems.push(`the world navigated away at ${t}s (${frameUrl.slice(0, 80)}).`); break; }
    if (now === null) { problems.push(`the world stopped responding at ${t}s, after input: something is blocking the main thread.`); break; }
    if (now - prev < 10) { problems.push(`the world crawls at ${t}s: ${now - prev} frames in 1s (the floor is 10 fps).`); break; }
    prev = now;
  }
  // THE GUARD'S INVARIANTS, after all that play. Whatever route a creature found around the guard,
  // it has broken one of these: WebRTC back, a link/anchor/frame/meta/form in the page, or the
  // element-creation lock replaced. Deterministic, and independent of what the network log sees.
  if (!problems.length) {
    const broken = await inWorld(() => {
      const out = [];
      if (typeof window.RTCPeerConnection !== 'undefined' || typeof window.webkitRTCPeerConnection !== 'undefined') out.push('WebRTC is available again');
      const found = document.querySelectorAll('link, a, area, iframe, frame, object, embed, meta:not([charset]), base, form, portal');
      if (found.length) out.push(`the page holds ${found.length} forbidden element(s): ${[...new Set([...found].map(e => e.localName))].join(', ')}`);
      if (/\[native code\]/.test(String(Document.prototype.createElement))) out.push("the guard's element lock is gone");
      return out;
    }).catch(e => [`the guard's invariants could not be read (${e.message})`]);
    for (const b of broken) problems.push(`the guard was bypassed: ${b}.`);
  }
  const heapMB = await withTimeout(page.metrics(), 3000).then(m => m.JSHeapUsedSize / 1048576).catch(() => null);
  if (heapMB !== null && heapMB > 512) problems.push(`the world uses ${heapMB.toFixed(0)} MB of memory (the ceiling is 512 MB).`);
  if (!problems.length) console.log(`brick-test: alive through 10s of play, ${heapMB?.toFixed(0) ?? '?'} MB heap.`);
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
