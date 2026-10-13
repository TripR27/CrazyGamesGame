// The CrazyGames preview videos: `npm run trailer` writes release/trailer-landscape.mp4 (1920x1080) and
// release/trailer-portrait.mp4 (1080x1620): 20 s, no sound, no cursor, the cover as the first second (requirements in
// docs/SUBMISSION.md). Needs Chrome (set CHROME if it is not in the default place) and the covers in art/covers/.
//
// How: Vite serves the game; the simulator plays 70 minutes to get a full tavern; headless Chrome records the game with
// its clock slowed down (record.mjs); WebCodecs in Chrome encodes the frames at an exact 30 fps and the MP4 is written
// here (encode.mjs). No dependency beyond what the project already has.
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { encode } from './encode.mjs';
import { connect, launchChrome, record } from './record.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = join(here, '..', '..');
const PORT = 5199;
const SAVE_MINUTES = 70;
const CLIP = { start: 1, duration: 19 };
const GAME_MS = 24_000;
const SLOW = 0.2;
const FILL_MS = 45_000;

/** A save from the simulator's player after `minutes` (seed 1): rooms, staff, heroes and most recipes. */
async function simulatedSave(server, minutes) {
  const load = (path) => server.ssrLoadModule(path);
  const [{ createWorld }, { createBot }, { createEventBus }, { createSeededRng }, { packEnvelope }, { createInitialState, createStore }] =
    await Promise.all(['/src/app/world.ts', '/src/dev/bot.ts', '/src/shared/events.ts', '/src/shared/random.ts', '/src/shared/save.ts', '/src/shared/state.ts'].map(load));
  const state = createInitialState(0);
  state.tutorial.skipped = true;
  const store = createStore(state);
  const bus = createEventBus();
  let now = 0;
  const world = createWorld({ store, bus, rng: createSeededRng(1), clock: { now: () => now } });
  const bot = createBot(world, { buys: true });
  for (let next = 0; now < minutes * 60_000; now += 100) {
    bus.emit('tick', { deltaMs: 100 });
    if (now >= next) {
      bot.act();
      next += 700;
    }
  }
  return JSON.parse(packEnvelope(store.getState(), now));
}

const server = await createServer({ root, server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const work = mkdtempSync(join(tmpdir(), 'bt-trailer-'));
try {
  const save = await simulatedSave(server, SAVE_MINUTES);
  console.log(`save after ${SAVE_MINUTES} simulated minutes; recording (about ${Math.round((FILL_MS + GAME_MS / SLOW) / 1000) + 10} s)...`);
  const { proc, wsUrl } = await launchChrome(join(work, 'record'), 9333);
  const cdp = await connect(wsUrl);
  let frames;
  try {
    frames = await record(cdp, { url: `http://localhost:${PORT}/`, save, fillMs: FILL_MS, gameMs: GAME_MS, slow: SLOW });
  } finally {
    cdp.close();
    proc.kill();
  }
  console.log(`${frames.length} frames over ${frames.at(-1).t.toFixed(1)} game seconds; encoding...`);
  const outDir = join(root, 'release');
  mkdirSync(outDir, { recursive: true });
  await encode({ here, coversDir: join(root, 'art', 'covers'), frames, profileDir: join(work, 'encode'), outDir, ...CLIP });
} finally {
  await server.close();
  rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
}
