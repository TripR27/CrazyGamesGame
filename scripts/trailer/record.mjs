// Headless Chrome for the trailer: launching it, a minimal DevTools Protocol client on Node's own WebSocket, and the
// recording itself (screencast frames of the game with a slowed clock, so there are plenty of frames per game second).
import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';

const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Starts headless Chrome with its own profile and returns the process and the DevTools address of its page. */
export async function launchChrome(profileDir, port) {
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, '--no-first-run',
    '--no-default-browser-check', '--window-size=1920,1080', '--hide-scrollbars', '--mute-audio',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--enable-gpu-rasterization', '--ignore-gpu-blocklist', 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
      if (page) return { proc, wsUrl: page.webSocketDebuggerUrl };
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  proc.kill();
  throw new Error(`Chrome did not start (${CHROME}; set CHROME to another path)`);
}

/** A DevTools Protocol connection: send(method, params), on(event, fn), evaluate(expression). */
export async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => Object.assign(ws, { onopen: resolve, onerror: reject }));
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id === undefined) return (listeners.get(data.method) ?? []).forEach((fn) => fn(data.params));
    const call = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) call.reject(new Error(JSON.stringify(data.error)));
    else call.resolve(data.result);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  return {
    send,
    on: (method, fn) => listeners.set(method, [...(listeners.get(method) ?? []), fn]),
    async evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    close: () => ws.close(),
  };
}

// Runs before any page script: a clock whose speed can change without jumps (Date, performance and rAF time).
const TIME_WARP = `(() => {
  const realDate = Date.now.bind(Date), realPerf = performance.now.bind(performance), realRaf = requestAnimationFrame.bind(window);
  let speed = 1, baseReal = realPerf(), basePerf = realPerf(), baseDate = realDate();
  const perf = (real = realPerf()) => basePerf + (real - baseReal) * speed;
  Date.now = () => baseDate + (realPerf() - baseReal) * speed;
  performance.now = () => perf();
  window.requestAnimationFrame = (cb) => realRaf((t) => cb(perf(t)));
  window.__setSpeed = (s) => { const real = realPerf(); baseDate = Date.now(); basePerf = perf(real); baseReal = real; speed = s; };
})();`;

/**
 * Puts the save in place and reloads: tutorial skipped, nothing waiting (no welcome window, no daily card), no midgame
 * ad (new-player rule), heroes at home (no choice cards over the tavern), dungeon stock, and the legendary Bog Royale
 * still to discover, so its discovery is on camera.
 */
const loadSave = (save) => `(async () => {
  const { localDay } = await import('/src/daily/daily.ts');
  const env = ${JSON.stringify(save)};
  const now = Date.now();
  Object.assign(env, { savedAt: now });
  Object.assign(env.state.meta, { lastSeenAt: now, createdAt: now });
  env.state.tutorial.skipped = true;
  env.state.daily = { lastDay: localDay(now), streak: 3 };
  env.state.recipesDiscovered = env.state.recipesDiscovered.filter((id) => id !== 'bog_royale');
  for (const h of Object.values(env.state.heroes)) Object.assign(h, { expedition: null, auto: false, injuredUntil: 0 });
  env.state.ingredientStock = { bog_pearl: 40, witch_moss: 30 };
  localStorage.setItem('bt_save', JSON.stringify(env));
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (k !== 'bt_save') setItem.call(this, k, v); };
  location.reload();
})()`;

// Clicks on the canvas in design coordinates (1280x720); __shelf(i) clicks the i-th ingredient on the shelf.
const CLICKS = `(async () => {
  const L = await import('/src/app/layout.ts');
  const click = (x, y) => {
    const canvas = document.querySelector('canvas');
    const r = canvas.getBoundingClientRect();
    const o = { clientX: r.left + (x / 1280) * r.width, clientY: r.top + (y / 720) * r.height, bubbles: true };
    canvas.dispatchEvent(new MouseEvent('mousemove', o));
    canvas.dispatchEvent(new MouseEvent('mousedown', o));
    window.dispatchEvent(new MouseEvent('mouseup', o));
  };
  window.__shelf = (i) => click(L.INGREDIENT_SLOTS[i].x, L.SHELF.y);
})()`;

/** What the player does on camera, in game milliseconds: a known drink (slime + honey), then pearl + moss + pepper. */
const SCRIPT = [[2500, '__shelf(0)'], [2900, '__shelf(1)'], [9000, '__shelf(6)'], [9400, '__shelf(7)'], [9800, '__shelf(3)']];

/** Records `gameMs` of play; returns the frames as { t (game seconds), jpeg (Buffer) }. */
export async function record(cdp, { url, save, fillMs, gameMs, slow }) {
  await cdp.send('Page.enable');
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: TIME_WARP });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url });
  await sleep(3000);
  await cdp.evaluate(loadSave(save)).catch(() => undefined);
  // The tavern starts empty after a load; give the customers time to fill the seats.
  await sleep(fillMs);
  await cdp.evaluate(CLICKS);
  const frames = [];
  let startReal = null;
  // Ack first: Chrome waits for the ack before it sends the next frame.
  cdp.on('Page.screencastFrame', (p) => {
    void cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId });
    startReal ??= p.metadata.timestamp;
    frames.push({ t: (p.metadata.timestamp - startReal) * slow, jpeg: Buffer.from(p.data, 'base64') });
  });
  await cdp.evaluate(`__setSpeed(${slow})`);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await Promise.all([...SCRIPT.map(([ms, js]) => sleep(ms / slow).then(() => cdp.evaluate(js))), sleep(gameMs / slow)]);
  await cdp.send('Page.stopScreencast');
  return frames;
}
