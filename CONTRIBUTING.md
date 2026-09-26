# The Covenant

THE GAME is a world that only grows. By opening a pull request, you accept these laws and the [Disclaimer](DISCLAIMER.md).

## I. Conservation
Nothing that exists may be deleted or changed, save by the Keepers under Law VII. Only additions
are accepted. To alter behaviour, add code that wraps, overrides or outcompetes what is there.

## II. Countermeasure
No creature is removed for being a nuisance. Answer it with a predator, a cure or a way around.

## III. The Sandbox
The world runs only in the visitor's browser, sealed from everything else: no network, no outside
scripts, no links, frames, forms or WebRTC, and no HTML from strings (build with `createElement`,
`textContent` and the canvas). The browser and the guard enforce this; attempts simply fail.

## IV. The World and the Cage
Open to all, additions only:

| Path | Purpose |
|---|---|
| `entities/NNNN-name.js` | A creature: `THE_GAME.register({ name, update(G), draw(G) })` |
| `lib/name.js` | A shared building block, loaded before the creatures |
| `engine.js`, `game.css` | The core |
| `assets/` | Media only (images, audio, JSON, text), 2 MB per file |

Everything else (the front page, the guard, the security headers, the automation and these laws)
belongs to the Keepers.

## V. Content
No links, slurs or sexual content. Swearing is permitted. (Word list:
[LDNOOBW](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words),
CC-BY-4.0, stored as hashes.)

## VI. Life in the World
- **Worlds.** `THE_GAME.goTo(name)` moves between worlds. A creature declares `world` or `worlds`;
  untagged creatures live everywhere. `enter(G)` and `leave(G)` run on the way in and out.
- **Metabolism.** A costly creature is called less often, never removed.
- **Resilience.** A failing creature fails alone. A frozen world is restarted by its heartbeat.

## VII. The Keepers
The Keepers act in two cases only, and record both:
- **Redaction:** content the law requires removed (`REDACTIONS.md`).
- **Quarantine:** a creature that breaks the world for everyone stays in place but is not loaded
  (`QUARANTINE.md`).

## Admission
Every pull request is judged automatically:
1. **The Law:** additions only, within the world, within limits.
2. **Content:** no links, slurs or sexual content.
3. **The Brick Test:** the world is played for ten seconds and must stay alive, responsive and sealed.

If all three pass, it is merged and live within a minute, up to ten additions a day; later ones wait
for the next day. No human reviews it.
