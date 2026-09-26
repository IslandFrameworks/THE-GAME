// The only script in the outer page. It never runs contributed code; it just opens the cage.
document.getElementById('enter').addEventListener('click', () => {
  const world = document.getElementById('world');
  world.src = 'game.html';
  world.hidden = false;
  document.getElementById('gate').remove();
  world.focus();
});
