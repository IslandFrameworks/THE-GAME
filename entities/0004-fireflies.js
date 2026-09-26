// Commit 0004. Fireflies drift near the ground and gather around the red square when it stands still.
(function () {
  const flies = Array.from({ length: 14 }, () => ({ x: Math.random() * 800, y: 300 + Math.random() * 200, t: Math.random() * 100 }));
  THE_GAME.register({
    name: 'fireflies',
    update(G) {
      const square = G.entities.find(e => e.name === 'red square');
      for (const f of flies) {
        f.t += 0.05;
        f.x += Math.cos(f.t) * 0.8;
        f.y += Math.sin(f.t * 1.3) * 0.6;
        if (square) { f.x += (square.x - f.x) * 0.002; f.y += (square.y - f.y) * 0.002; }
      }
    },
    draw(G) {
      for (const f of flies) {
        const glow = 0.4 + 0.6 * Math.abs(Math.sin(f.t * 2));
        G.ctx.fillStyle = `rgba(190, 255, 120, ${glow.toFixed(2)})`;
        G.ctx.fillRect(f.x, f.y, 3, 3);
      }
    },
  });
})();
