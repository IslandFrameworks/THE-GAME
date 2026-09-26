# The Covenant

THE GAME is a world that only grows. Read these laws before you add to it.

## I. The Law of Conservation
You may add files, functions and lines. You may not delete or change what is already here.
Every existing line is permanent. To change how something behaves, add new code that wraps it,
overrides it or outcompetes it. (Nature does the same: you still carry the genes for a tail.)

## II. The Countermeasure Rule
If an entity is toxic, overpowered or obnoxious, you may not remove it. You must evolve its
natural predator, a cure, or a way around it.

## III. The Sandbox Mandate
All code runs in the visitor's browser and nowhere else. No network requests, no outside scripts,
no crypto miners, no tracking. The page's security policy blocks these anyway; trying is a waste of
a PR.

## IV. The World and the Cage
**The world is yours.** Anyone may build on any of it, add-only:
- `entities/NNNN-short-name.js`: a creature. Call `THE_GAME.register({ name, update(G) {}, draw(G) {} })`.
- `lib/short-name.js`: a shared building block (physics, zones, sound, anything). Every lib file
  loads automatically, before the creatures, in filename order.
- `engine.js`, `game.css`: the core itself. Extend it, wrap it, override it. You still cannot delete
  or rewrite a line that exists; you add the line that supersedes it.
- `assets/`: media only (png, jpg, gif, webp, avif, mp3, ogg, wav, m4a, json, txt), 2 MB per file.

**The cage is not.** `index.html` (it holds the sandbox), `game.html` and `guard.js` (they keep the
world from ever running outside it), `shell.*`, `_headers` (the security policy),
`404.html`, `.github/`, `scripts/`, `package*.json`, and the law files belong to the Keepers. They are
what keeps the world from ever becoming malware, and they are the only thing you cannot touch.

## V. The Keepers' Exceptions
- **Redaction.** The law can require content to be removed (copyright, or anything illegal). Only
  the Keepers may redact, only for that, and every redaction is recorded in `REDACTIONS.md`.
- **Quarantine.** An entity that bricks the world for everyone (it navigates the game away, or
  loops forever) cannot be answered by a countermeasure, because the world never gets another turn.
  The Keepers may list it in `QUARANTINE.md`: the file stays, untouched and dormant, but is not
  loaded. Bricking the world is the one move the game does not allow.

## VI. Content
- **No links.** No URLs, web addresses or invite links anywhere in the world. Nothing in it can
  send anyone anywhere, so a link is only ever spam.
- **No slurs and no sexual content.** Checked automatically against a word list (the list of
  [LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words),
  CC-BY-4.0, stored here only as hashes). Ordinary swearing is fine.
- Anything the checks miss, the Keepers can still redact (law V).

## How a PR becomes law
Two automated checks run on every pull request:
1. **The Law**: nothing removed or changed, only `entities/` and `assets/` touched, sizes and names
   in bounds.
2. **The brick test**: the world is booted with your entity in it, and it must keep living.

If both pass, the bot merges it and the world redeploys within a minute. There is no human review.
Choose your mutations wisely.
