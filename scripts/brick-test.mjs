// The brick test. Boots the world AS IT WOULD BE after merging (every loaded entity, the new one
// included) in headless Chrome under the real CSP, and fails if the world stops living.
//
// Two ways an entity can brick THE GAME for everyone, and neither can be answered by a
// countermeasure, because the world never gets another turn:
//   - looping forever (the frame counter stops advancing; page.evaluate never returns)
//   - navigating the game away (the page leaves this site)
//
// Runs ONLY in the workflow's zero-permission job: the one place a contributor's code executes
// holds no token scopes and no secrets. Usage: node scripts/brick-test.mjs [--chrome /path]
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const root = process.cwd();
const argv = process.argv.slice(2);
const chrome = argv[argv.indexOf('--chrome') + 1] && argv.includes('--chrome')
  ? argv[argv.indexOf('--chrome') + 1]
  : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find(existsSync);
if (!chrome) { console.error('brick-test: no Chrome found (pass --chrome).'); process.exit(2); }

execFileSync('node', ['scripts/build-manifest.mjs'], { cwd: root, stdio: 'inherit' });
const hdr = Object.fromEntries([...readFileSync(path.join(root, '_headers'), 'utf8').matchAll(/^  ([A-Za-z-]+): (.*)$/gm)].map(m => [m[1], m[2]]));
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const srv = http.createServer((req, res) => {
  const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'game.html';
  const p = path.join(root, rel);
  if (!p.startsWith(root + path.sep) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] ?? 'application/octet-stream', ...hdr });
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
  await withTimeout(page.goto(`${origin}/game.html`), 10_000).catch(e => problems.push(`the world did not load: ${e.message}`));
  const frameAt = () => withTimeout(page.evaluate(() => (window.THE_GAME ? window.THE_GAME.frame : -1)), 3000);
  await new Promise(r => setTimeout(r, 1000));
  const a = await frameAt().catch(() => null);
  await new Promise(r => setTimeout(r, 2000));
  const b = await frameAt().catch(() => null);
  const url = page.url();
  if (!url.startsWith(origin)) problems.push(`the world navigated away (${url.slice(0, 80)}).`);
  else if (a === null || b === null) problems.push('the world stopped responding: an entity is blocking the main thread (an endless loop?).');
  else if (a < 0) problems.push('THE_GAME never started.');
  else if (b <= a) problems.push(`the world stopped advancing (frame ${a} -> ${b} over 2s).`);
  else console.log(`brick-test: alive, ${b - a} frames in 2s.`);
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
