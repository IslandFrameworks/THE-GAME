// The world's load order, for the deploy step: lib/*.js (shared building blocks) then
// entities/*.js, each in filename order, minus QUARANTINE.md. Returns paths; build-site.mjs writes
// them into dist/game.html as ordinary <script> tags. Parser-inserted tags are not a Trusted Types
// sink, so no script ever has to create a script (under the world's Trusted Types policy, setting
// a script's src from code is refused, which is the point).
//
// QUARANTINE.md (Keepers only) lists entities that would brick the world for everyone. A
// quarantined file is NOT deleted; it stays in the repo, dormant. Nothing else is ever skipped.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function worldScripts() {
  const quarantined = new Set(existsSync('QUARANTINE.md')
    ? [...readFileSync('QUARANTINE.md', 'utf8').matchAll(/^- `?(\d{4}-[a-z0-9-]+\.js)`?/gm)].map(m => m[1]) : []);
  const libs = existsSync('lib') ? readdirSync('lib').filter(f => /^[a-z0-9-]+\.js$/.test(f)).sort().map(f => 'lib/' + f) : [];
  const ents = readdirSync('entities').filter(f => /^\d{4}-[a-z0-9-]+\.js$/.test(f) && !quarantined.has(f)).sort().map(f => 'entities/' + f);
  return { libs, ents, quarantined: quarantined.size };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { libs, ents, quarantined } = worldScripts();
  console.log(`world: ${libs.length} lib, ${ents.length} entities${quarantined ? `, ${quarantined} quarantined` : ''}`);
}
