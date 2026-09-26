// Content gates, shared by the gatekeeper and the Keeper's blocklist builder.
//
// WORDS: LDNOOBW "en" (github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words,
// CC-BY-4.0, pinned in blocklist.json), minus SWEAR_ALLOW below. Stored only as hashes, so this
// public repo never publishes the list and nobody can read it to route around it.
// Matching is on whole words after normalisation, so a word that merely CONTAINS a blocked string
// ("analysis", "cockpit", "Scunthorpe") is never flagged.
import { createHash } from 'node:crypto';

// Graham, 2026-09-26: "swearing is probably fine". Ordinary swears stay allowed; slurs and sexual
// content do not. Edit this list, then rerun scripts/build-blocklist.mjs.
export const SWEAR_ALLOW = [
  'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker', 'shit', 'shitty', 'bullshit', 'crap',
  'damn', 'goddamn', 'hell', 'ass', 'asshole', 'bastard', 'piss', 'pissed', 'bloody', 'bollocks',
  'arse', 'arsehole', 'wtf', 'screw', 'sucks',
];

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'i' };

/**
 * Words as a reader sees them: camelCase and snake_case split, lowercased, leetspeak undone.
 * Letter swaps apply ONLY to tokens that already contain a letter: measured on TypeScript's own
 * compiler, swapping inside plain numbers turned 8008 into "boob" and 717 into "tit".
 */
export function words(text) {
  const out = [];
  for (const tok of text.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().match(/[a-z0-9@$!|]+/g) ?? []) {
    if (!/[a-z]/.test(tok)) continue;
    for (const w of tok.replace(/[0134578@$!|]/g, c => LEET[c]).match(/[a-z]+/g) ?? []) out.push(w);
  }
  return out;
}

export const hashOf = s => createHash('sha256').update(s).digest('hex').slice(0, 20);

/** Every 1..6 word window, hashed, so multi-word entries match too. */
export function* windows(ws) {
  for (let i = 0; i < ws.length; i++)
    for (let n = 1; n <= 6 && i + n <= ws.length; n++) yield ws.slice(i, i + n).join(' ');
}

// LINKS: only inside string literals and comments, which is where a link has to live. Measured
// on real code first: a bare domain pattern over JS fires on `window.top`, `config.io`, `this.dev`.
export const LINK_PATTERNS = [
  /\bhttps?:\/\//i, /\bwww\./i, /\b(discord\.gg|discord\.com\/invite|t\.me|bit\.ly|tinyurl\.com|goo\.gl|linktr\.ee)\b/i,
  /\b[a-z0-9-]{2,}\.(com|net|org|io|gg|xyz|ru|cn|tk|ly|me|co|app|dev|link|info|biz|site|online|shop|top|club|live|tv|us|uk|de|fr|onion)\b/i,
];

/** String literals and comments in a line of JS/CSS (approximate, and deliberately so). */
export function stringsAndComments(line) {
  const out = [];
  const re = /\/\/.*$|\/\*.*?(\*\/|$)|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g;
  let m; while ((m = re.exec(line))) out.push(m[0]);
  return out;
}
