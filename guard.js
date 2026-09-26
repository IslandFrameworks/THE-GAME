// THE GUARD. The first script game.html runs, before the engine or any contributed code. The world
// only ever runs inside index.html's sandboxed frame. Opened any other way (someone links straight
// to /game), it stops loading everything after this line and goes to the front page instead, so
// contributed code never runs outside the cage. game.html and this file are Keeper-only.
if (window.top === window.self) {
  window.stop();
  document.documentElement.innerHTML = '';
  location.replace('/');
  throw new Error('THE GAME only runs inside its frame.');
}
