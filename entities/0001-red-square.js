// Commit 0001. The first creature: a 16x16 red square that moves with the arrow keys.
THE_GAME.register({
  name: 'red square',
  x: 100, y: 100, size: 16, speed: 3,
  update(G) {
    if (G.keys.has('ArrowLeft')) this.x -= this.speed;
    if (G.keys.has('ArrowRight')) this.x += this.speed;
    if (G.keys.has('ArrowUp')) this.y -= this.speed;
    if (G.keys.has('ArrowDown')) this.y += this.speed;
  },
  draw(G) {
    G.ctx.fillStyle = '#e33';
    G.ctx.fillRect(this.x, this.y, this.size, this.size);
  },
});
