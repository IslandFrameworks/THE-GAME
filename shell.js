// The front page's only script. It never runs contributed code. It opens the world (which lives on
// its own site, in its own process in desktop browsers) and keeps it alive: the world's guard sends
// a heartbeat every half second, and if the heartbeat stops, or the world stops moving, this page
// restarts it. If it keeps breaking, it stops retrying and says so.
const WORLD = '__WORLD_ORIGIN__';
const SILENCE_MS = 3000;   // no heartbeat for this long: the world froze
const STALL_MS = 5000;     // heartbeats but no new frames for this long: the world stopped moving
const GRACE_MS = 8000;     // after (re)starting, or coming back to the tab, before judging
const REPORT = 'https://github.com/IslandFrameworks/THE-GAME/issues/new?title=The+world+keeps+freezing';

const frame = document.getElementById('world');
const status = document.getElementById('status');
let started = false, lastBeat = 0, lastFrame = -1, lastAdvance = 0, gaveUp = false;
const restarts = [];
const state = { beats: 0, restarts: 0, gaveUp: false };
window.__heartbeat = state; // read-only view for the brick test; nothing depends on it

const now = () => Date.now();
function graceUntil() { lastBeat = lastAdvance = now() + GRACE_MS; }
function load() { frame.src = `${WORLD}/game?start=${now()}`; graceUntil(); }

function say(text, withReport) {
  status.replaceChildren(document.createTextNode(text));
  if (withReport) {
    const a = document.createElement('a');
    a.href = REPORT; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = ' Report it';
    status.append(a);
  }
  status.hidden = false;
}

function restart(reason) {
  const t = now();
  restarts.push(t);
  while (restarts.length && t - restarts[0] > 60000) restarts.shift();
  state.restarts++;
  if (restarts.length >= 3) {
    gaveUp = state.gaveUp = true;
    say('The world keeps breaking. A creature in it may be broken; the Keepers can switch it off.', true);
    frame.src = 'about:blank';
    return;
  }
  say(`The world ${reason}. Restarting…`, false);
  setTimeout(() => { if (!gaveUp) status.hidden = true; }, 2500);
  load();
}

addEventListener('message', (e) => {
  // The world is sandboxed, so its messages carry origin "null", never its address. What proves a
  // message came from the world is its SOURCE: the world frame's own window, which no other frame
  // can be. (Checking e.origin against the world's address threw away every real heartbeat.)
  if (e.source !== frame.contentWindow || e.origin !== 'null') return;
  if (!e.data || e.data.type !== 'THE_GAME_HEARTBEAT') return;
  state.beats++;
  lastBeat = Math.max(lastBeat, now());
  if (e.data.frame !== lastFrame) { lastFrame = e.data.frame; lastAdvance = Math.max(lastAdvance, now()); }
});

// Background tabs slow timers to as little as one a minute; judging then would "detect" a freeze on
// every tab switch. So only a visible page watches, and coming back starts a fresh grace period.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && started) graceUntil(); });
setInterval(() => {
  if (!started || gaveUp || document.visibilityState !== 'visible') return;
  const t = now();
  if (t - lastBeat > SILENCE_MS) restart('froze');
  else if (t - lastAdvance > STALL_MS) restart('stopped moving');
}, 500);

document.getElementById('enter').addEventListener('click', () => {
  frame.hidden = false;
  document.getElementById('gate').remove();
  started = true;
  load();
  frame.focus();
});
