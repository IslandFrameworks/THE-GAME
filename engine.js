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
  const safely = (entity, method) => {
    if (typeof entity[method] !== 'function') return;
    try { entity[method](window.THE_GAME); }
    catch (err) {
      const n = (failures.get(entity) || 0) + 1;
      failures.set(entity, n);
      if (n === 1) console.warn(`[THE_GAME] ${entity.name || 'an entity'}.${method} failed:`, err);
    }
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
