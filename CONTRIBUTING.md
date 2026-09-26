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

## IV. The Habitat
- Add one file to `entities/`, named `NNNN-short-name.js` (the next free number keeps the order).
  Call `THE_GAME.register({ name, update(G) {}, draw(G) {} })` from it.
- Assets go in `assets/`, 2 MB each at most.
- Nothing outside `entities/` and `assets/` is yours to touch. The engine's machinery belongs to
  the Keepers.

## V. The Keepers' Exceptions
- **Redaction.** The law can require content to be removed (copyright, or anything illegal). Only
  the Keepers may redact, only for that, and every redaction is recorded in `REDACTIONS.md`.
- **Quarantine.** An entity that bricks the world for everyone (it navigates the game away, or
  loops forever) cannot be answered by a countermeasure, because the world never gets another turn.
  The Keepers may list it in `QUARANTINE.md`: the file stays, untouched and dormant, but is not
  loaded. Bricking the world is the one move the game does not allow.

## How a PR becomes law
Two automated checks run on every pull request:
1. **The Law**: nothing removed or changed, only `entities/` and `assets/` touched, sizes and names
   in bounds.
2. **The brick test**: the world is booted with your entity in it, and it must keep living.

If both pass, the bot merges it and the world redeploys within a minute. There is no human review.
Choose your mutations wisely.
