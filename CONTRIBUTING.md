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
a PR. Some doors are simply not in the world at all:
- **No links, anchors, frames, meta tags or forms.** `document.createElement` refuses them, and
  WebRTC does not exist here. (Each was a way to reach the outside that the security policy alone
  does not close.)
- **No HTML from strings.** `innerHTML`, `insertAdjacentHTML` and friends are refused (Trusted
  Types). Build with `createElement`, `textContent` and the canvas instead.

## IV. The World and the Cage
**The world is yours.** Anyone may build on any of it, add-only:
- `entities/NNNN-short-name.js`: a creature. Call `THE_GAME.register({ name, update(G) {}, draw(G) {} })`.
- `lib/short-name.js`: a shared building block (physics, zones, sound, anything). Every lib file
  loads automatically, before the creatures, in filename order.
- `engine.js`, `game.css`: the core itself. Extend it, wrap it, override it. You still cannot delete
  or rewrite a line that exists; you add the line that supersedes it.
- `assets/`: media only (png, jpg, gif, webp, avif, mp3, ogg, wav, m4a, json, txt), 2 MB per file.

**The cage is not.** `index.html` (it holds the sandbox), `game.html` and `guard.js` (they keep the
world from ever running outside it), `shell.*` (the front page and its heartbeat watcher),
`headers/` (the security policies),
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

## VII. The Living World
- **Worlds.** `THE_GAME.goTo('cave')` moves between worlds. A creature can live in one
  (`world: 'sky'`), several (`worlds: ['sky', 'space']`) or, untagged, everywhere. Outside its world
  it sleeps with its state intact; `enter(G)` and `leave(G)` run on the way in and out.
- **Metabolism.** Every creature shares one frame. One that costs too much is called less often,
  never removed; it recovers as soon as it gets cheaper. The costly ones starve.
- **Failure is local.** A creature that throws is set aside for that frame; the world goes on.
- **The heartbeat.** The world lives on its own site and beats twice a second to the front page. If
  it freezes (a time bomb, a loop on some rare input), the front page notices and restarts it; if it
  keeps freezing, it stops and asks to be reported. Silencing the heartbeat fails the brick test.

## How a PR becomes law
Three automated checks run on every pull request:
1. **The Law**: nothing removed or changed, nothing outside the world touched, sizes, names and
   file types in bounds.
2. **Content**: no links, no slurs, no sexual content.
3. **The brick test**: the world is booted with your change in it and PLAYED for ten seconds (keys,
   clicks), and must keep living. It fails if the world freezes (on its own or on input), leaves the
   page, crawls below 10 frames a second, eats over 512 MB, or has found a way around the doors in
   law III.

If all three pass, the bot merges it and the world redeploys within a minute. There is no human
review. Choose your mutations wisely.
