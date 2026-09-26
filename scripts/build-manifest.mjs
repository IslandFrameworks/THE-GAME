// Deploy step: every file in entities/ is loaded in filename order, so ordering is deterministic and
// no contributor ever edits a shared list (which would conflict and, under the Law of Conservation,
// would count as a deletion). async = false keeps dynamically inserted scripts in insertion order.
//
// QUARANTINE.md (Keepers only) lists entities that would brick the world for everyone: an entity
// that navigates its frame away or loops forever never yields, so no countermeasure can answer it.
// A quarantined file is NOT deleted; it stays in the repo, dormant. Nothing else is ever skipped.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
const quarantined = new Set(existsSync('QUARANTINE.md')
  ? [...readFileSync('QUARANTINE.md', 'utf8').matchAll(/^- `?(\d{4}-[a-z0-9-]+\.js)`?/gm)].map(m => m[1]) : []);
// lib/ (shared building blocks) loads before entities/, so creatures can use what lib provides.
const libs = existsSync('lib') ? readdirSync('lib').filter(f => /^[a-z0-9-]+\.js$/.test(f)).sort().map(f => 'lib/' + f) : [];
const ents = readdirSync('entities').filter(f => /^[\w.-]+\.js$/.test(f) && !quarantined.has(f)).sort().map(f => 'entities/' + f);
const files = [...libs, ...ents];
writeFileSync('manifest.js',
  `// GENERATED at deploy from entities/. Do not commit.\n` +
  `for (const f of ${JSON.stringify(files)}) {\n` +
  `  const s = document.createElement('script');\n` +
  `  s.src = f; s.async = false;\n` +
  `  document.body.appendChild(s);\n` +
  `}\n`);
console.log(`manifest: ${libs.length} lib, ${ents.length} entities${quarantined.size ? `, ${quarantined.size} quarantined` : ''}`);
