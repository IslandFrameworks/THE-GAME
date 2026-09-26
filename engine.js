// THE GAME — the seed. Everything that lives here was added; nothing was ever taken away.
(function () {
  const canvas = document.getElementById('world');
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  addEventListener('resize', resize);
  resize();

  const keys = new Set();
  addEventListener('keydown', e => keys.add(e.key));
  addEventListener('keyup', e => keys.delete(e.key));

  window.THE_GAME = {
    entities: [],
    keys,
    canvas,
    ctx,
    frame: 0,
    register: (entity) => window.THE_GAME.entities.push(entity),
  };

  // One failing entity must not end the world. It is not removed (that would be a deletion); its
  // failures are counted and it keeps getting called, so a later contribution can heal it.
  const failures = new WeakMap();
  // METABOLISM. The world gets ~16ms a frame, shared by everything that has ever been added. A
  // creature averaging over 4ms per call is called less often, in proportion to its cost (at most
  // once every 30 frames). Never removed, and it recovers as soon as it gets cheaper: the costly
  // ones starve, the world stays smooth.
  const cost = new WeakMap();
  const BUDGET_MS = 4;
  const safely = (entity, method) => {
    if (typeof entity[method] !== 'function') return;
    const avg = cost.get(entity) || 0;
    if (avg > BUDGET_MS && window.THE_GAME.frame % Math.min(30, Math.ceil(avg / BUDGET_MS)) !== 0) return;
    const t0 = performance.now();
    try { entity[method](window.THE_GAME); }
    catch (err) {
      const n = (failures.get(entity) || 0) + 1;
      failures.set(entity, n);
      if (n === 1) console.warn(`[THE_GAME] ${entity.name || 'an entity'}.${method} failed:`, err);
    }
    cost.set(entity, avg * 0.9 + (performance.now() - t0) * 0.1);
  };

  function loop() {
    const G = window.THE_GAME;
    G.frame++;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const e of G.entities.slice()) safely(e, 'update');
    for (const e of G.entities.slice()) safely(e, 'draw');
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ---------------------------------------------------------------------------------------------
// WORLDS. Added, not rewritten: the loop above is untouched. A creature can live in one world
// (`world: 'sky'`) or several (`worlds: ['sky', 'space']`); an untagged creature lives everywhere.
// Only creatures in the current world run, so a shooting star in the sky stops when you go to the
// cave and picks up exactly where it was when you come back. `enter(G)` / `leave(G)` are called
// on the way in and out, for anything that should reset or save. The loop reads THE_GAME.entities
// through .slice(), so that is where the current world is chosen.
(function () {
  const G = window.THE_GAME;
  G.world = 'home';
  const livesIn = (e, w) => (e.worlds ? e.worlds.includes(w) : e.world ? e.world === w : true);
  G.inWorld = (e) => livesIn(e, G.world);
  const everyone = () => Array.prototype.slice.call(G.entities);
  G.entities.slice = function () { return everyone().filter(G.inWorld); };
  G.goTo = (next) => {
    if (next === G.world) return;
    const before = G.world;
    for (const e of everyone()) if (livesIn(e, before) && !livesIn(e, next) && typeof e.leave === 'function') { try { e.leave(G); } catch (err) { console.warn('[THE_GAME] leave failed:', err); } }
    G.world = next;
    for (const e of everyone()) if (livesIn(e, next) && !livesIn(e, before) && typeof e.enter === 'function') { try { e.enter(G); } catch (err) { console.warn('[THE_GAME] enter failed:', err); } }
  };
})();
