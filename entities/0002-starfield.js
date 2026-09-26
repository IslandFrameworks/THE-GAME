// Commit 0002. The sky: a slow field of twinkling stars behind whatever comes next.
(function () {
  const stars = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), phase: Math.random() * Math.PI * 2 }));
  THE_GAME.entities.unshift({
    name: 'starfield',
    draw(G) {
      const { width, height } = G.canvas;
      for (const s of stars) {
        const a = 0.35 + 0.35 * Math.sin(G.frame / 40 + s.phase);
        G.ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(2)})`;
        G.ctx.fillRect(Math.floor(s.x * width), Math.floor(s.y * height), 2, 2);
      }
    },
  });
})();
