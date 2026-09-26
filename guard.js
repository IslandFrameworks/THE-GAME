// THE GUARD. The first script game.html runs, before the engine or any contributed code.
//
// 1. The world only ever runs inside the front page's frame. Opened any other way (someone links
//    straight to the world's address, or another site frames it), it stops loading everything after
//    this line and goes to the front page instead, so contributed code never runs outside the cage.
const SHELL = '__SHELL_ORIGIN__';
const framedByShell = window.top !== window.self &&
  (!location.ancestorOrigins || location.ancestorOrigins[location.ancestorOrigins.length - 1] === SHELL);
if (!framedByShell) {
  window.stop();
  // replaceChildren, not innerHTML: Trusted Types refuses innerHTML here, and a guard that throws
  // before redirecting leaves the visitor on a blank page.
  document.documentElement.replaceChildren();
  if (window.top === window.self) location.replace(SHELL);
  throw new Error('THE GAME only runs inside its front page.');
}

// 1b. THE HEARTBEAT. Every half second, tell the front page this world is alive and how far it has
//     got. The world lives on its own site, so (in desktop browsers) it runs in its own process:
//     if it freezes, the front page keeps running, hears the silence and restarts it. References
//     are taken here, before any contributed code exists, so nothing contributed can re-route them.
(function () {
  const every = window.setInterval.bind(window);
  const parentWindow = window.parent;
  const send = parentWindow.postMessage.bind(parentWindow);
  every(() => {
    try { send({ type: 'THE_GAME_HEARTBEAT', frame: window.THE_GAME ? window.THE_GAME.frame : -1 }, SHELL); } catch (e) { /* nothing to do */ }
  }, 500);
})();

// 2. Close the network paths the security policy does NOT cover. Measured 2026-09-26 inside this
//    very sandbox: a <link rel=preconnect> opened a TCP connection, <link rel=dns-prefetch> made a
//    DNS lookup of an attacker-chosen name, and RTCPeerConnection sent STUN packets out. Neither
//    `webrtc 'block'` nor X-DNS-Prefetch-Control stops them in Chrome. Closed here instead, before
//    any contributed code exists. Trusted Types (in _headers) removes every HTML-from-a-string
//    route, so the DOM calls locked below are the only way to make elements at all.
(function () {
  const refuse = (what) => { throw new Error(`THE GAME: ${what} is not part of the world (the Covenant, III).`); };
  const lock = (obj, key, value) => Object.defineProperty(obj, key, { value, writable: false, configurable: false, enumerable: false });

  // WebRTC: peer connections reach any host over UDP, policy or not.
  for (const k of ['RTCPeerConnection', 'webkitRTCPeerConnection']) lock(window, k, undefined);

  // Elements that can reach, resolve, preconnect, navigate or embed: links (resource hints),
  // anchors and areas (DNS prefetch), frames and objects (fresh globals), meta (refresh), base, forms.
  const DENY = new Set(['link', 'a', 'area', 'iframe', 'frame', 'frameset', 'object', 'embed', 'meta', 'base', 'form', 'portal', 'fencedframe']);
  const nativeCreate = Document.prototype.createElement;
  const nativeCreateNS = Document.prototype.createElementNS;
  lock(Document.prototype, 'createElement', function createElement(name, ...rest) {
    if (DENY.has(String(name).toLowerCase())) refuse(`<${name}>`);
    return nativeCreate.call(this, name, ...rest);
  });
  lock(Document.prototype, 'createElementNS', function createElementNS(ns, qname, ...rest) {
    const local = String(qname).split(':').pop().toLowerCase();
    if (DENY.has(local)) refuse(`<${qname}>`);
    return nativeCreateNS.call(this, ns, qname, ...rest);
  });

  // The one <link> the page has (game.css) loaded before this script ran (a script waits for the
  // stylesheets before it). Its rules move to a constructed sheet and the element goes, so there
  // is no link left anywhere to rewire into a preconnect.
  for (const link of Array.from(document.querySelectorAll('link'))) {
    try {
      if (link.sheet) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(Array.from(link.sheet.cssRules, r => r.cssText).join('\n'));
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
    } catch (e) { /* styling is cosmetic; the removal below is not */ }
    link.remove();
  }
})();
