// Commit 0003. Every so often a comet crosses the sky, trailing light.
THE_GAME.register({
  name: 'comet',
  x: -50, y: 0, vx: 0, vy: 0, wait: 120,
  update(G) {
    if (this.wait > 0) { this.wait--; return; }
    if (this.x < -40 || this.x > G.canvas.width + 40 || this.y > G.canvas.height + 40) {
      this.x = -30; this.y = Math.random() * G.canvas.height * 0.5;
      this.vx = 4 + Math.random() * 3; this.vy = 1 + Math.random() * 1.5;
      this.wait = 200 + Math.floor(Math.random() * 400);
      return;
    }
    this.x += this.vx; this.y += this.vy;
  },
  draw(G) {
    if (this.wait > 0) return;
    for (let i = 0; i < 12; i++) {
      G.ctx.fillStyle = `rgba(255, 220, 120, ${(1 - i / 12).toFixed(2)})`;
      G.ctx.fillRect(this.x - i * this.vx, this.y - i * this.vy, 3, 3);
    }
  },
});
