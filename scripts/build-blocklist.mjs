// Keeper tool: regenerate scripts/blocklist.json from the pinned LDNOOBW "en" list.
// Usage: node scripts/build-blocklist.mjs <path-to-downloaded-en-file>
// The plain list is never committed; only its hashes are.
import { readFileSync, writeFileSync } from 'node:fs';
import { SWEAR_ALLOW, words, hashOf } from './content-rules.mjs';
const PIN = { source: 'https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words', file: 'en', commit: '5faf2ba42d7b1c0977169ec3611df25a3c08eb13', license: 'CC-BY-4.0' };
const allow = new Set(SWEAR_ALLOW);
const entries = readFileSync(process.argv[2], 'utf8').split('\n').map(l => words(l).join(' ')).filter(Boolean);
// Entries that reduce to 1-2 letter fragments ("s&m" -> "s m") match ordinary code everywhere
// (measured: 12 hits in Synapse's src/ alone), so they are dropped rather than kept as noise.
const kept = [...new Set(entries.filter(e => !allow.has(e) && !e.split(' ').some(w => w.length <= 2)))];
writeFileSync('scripts/blocklist.json', JSON.stringify({ ...PIN, allowed: SWEAR_ALLOW.length, count: kept.length, hashes: kept.map(hashOf).sort() }, null, 0) + '\n');
console.log(`blocklist: ${kept.length} entries (${entries.length} in source, ${entries.length - kept.length} allowed as swears or duplicates)`);
