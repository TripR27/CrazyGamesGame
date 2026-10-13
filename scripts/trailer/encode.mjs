// Encodes the recorded frames to H.264 in headless Chrome (WebCodecs, encode.html) and writes a plain MP4: ftyp, moov
// with full sample tables and the duration, then mdat ("faststart"). One video track at a constant frame rate, no audio.
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect, launchChrome, sleep } from './record.mjs';

const TIMESCALE = 30000;
const MOVIE_TIMESCALE = 1000;
const MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];

const u32 = (...values) => Buffer.concat(values.map((v) => { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return b; }));
const u16 = (...values) => Buffer.concat(values.map((v) => { const b = Buffer.alloc(2); b.writeUInt16BE(v & 0xffff); return b; }));
const zeros = (n) => Buffer.alloc(n);
const box = (type, ...parts) => { const payload = Buffer.concat(parts); return Buffer.concat([u32(8 + payload.length), Buffer.from(type, 'latin1'), payload]); };
const fullBox = (type, version, flags, ...parts) => box(type, u32((version << 24) | flags), ...parts);

function sampleEntry(width, height, avcC) {
  const fields = [zeros(6), u16(1), zeros(16), u16(width, height), u32(0x00480000, 0x00480000), zeros(4), u16(1), zeros(32), u16(0x0018, 0xffff)];
  return box('avc1', ...fields, box('avcC', avcC));
}

function moov(index, chunkOffset) {
  const { samples, width, height, fps } = index;
  const frameTicks = TIMESCALE / fps;
  const mediaDuration = samples.length * frameTicks;
  const movieDuration = Math.round((mediaDuration * MOVIE_TIMESCALE) / TIMESCALE);
  const syncs = samples.flatMap((s, i) => (s.key ? [i + 1] : []));
  const stbl = box('stbl',
    fullBox('stsd', 0, 0, u32(1), sampleEntry(width, height, Buffer.from(index.avcC, 'base64'))),
    fullBox('stts', 0, 0, u32(1, samples.length, frameTicks)),
    fullBox('stss', 0, 0, u32(syncs.length, ...syncs)),
    fullBox('stsc', 0, 0, u32(1, 1, samples.length, 1)),
    fullBox('stsz', 0, 0, u32(0, samples.length, ...samples.map((s) => s.size))),
    fullBox('stco', 0, 0, u32(1, chunkOffset)));
  const dinf = box('dinf', fullBox('dref', 0, 0, u32(1), fullBox('url ', 0, 1)));
  const minf = box('minf', fullBox('vmhd', 0, 1, zeros(8)), dinf, stbl);
  const hdlr = fullBox('hdlr', 0, 0, zeros(4), Buffer.from('vide'), zeros(12), Buffer.from('VideoHandler\0'));
  const mdhd = fullBox('mdhd', 0, 0, u32(0, 0, TIMESCALE, mediaDuration), u16(0x55c4, 0));
  const tkhd = fullBox('tkhd', 0, 3, u32(0, 0, 1, 0, movieDuration), zeros(8), u16(0, 0, 0, 0), u32(...MATRIX), u32(width * 65536, height * 65536));
  const mvhd = fullBox('mvhd', 0, 0, u32(0, 0, MOVIE_TIMESCALE, movieDuration, 0x00010000), u16(0x0100), zeros(10), u32(...MATRIX), zeros(24), u32(2));
  return box('moov', mvhd, box('trak', tkhd, box('mdia', mdhd, hdlr, minf)));
}

/** The MP4 file for the encoded samples (index from encode.html, data the samples back to back). */
export function mux(index, data) {
  const ftyp = box('ftyp', Buffer.from('isom'), u32(512), Buffer.from('isomiso2avc1mp41'));
  const offset = ftyp.length + moov(index, 0).length + 8;
  return Buffer.concat([ftyp, moov(index, offset), box('mdat', data)]);
}

/** A local server for encode.html: the page, the frames (from memory), the covers, and the encoded result. */
function serve(here, coversDir, frames, results) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (req.method === 'POST') {
      const parts = [];
      req.on('data', (c) => parts.push(c));
      req.on('end', () => {
        results.set(path, Buffer.concat(parts));
        res.end('ok');
      });
      return;
    }
    if (path === '/frames.json') return res.end(JSON.stringify(frames.map((f) => f.t)));
    const frame = /^\/frames\/(\d+)\.jpg$/.exec(path);
    if (frame) return res.writeHead(200, { 'content-type': 'image/jpeg' }).end(frames[Number(frame[1])]?.jpeg);
    if (path === '/encode.html') return res.writeHead(200, { 'content-type': 'text/html' }).end(readFileSync(join(here, 'encode.html')));
    if (path.startsWith('/covers/')) return res.writeHead(200, { 'content-type': 'image/png' }).end(readFileSync(join(coversDir, path.slice(8))));
    res.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(9444, '127.0.0.1', () => resolve(server)));
}

/** Encodes both trailers (landscape 1920x1080 and portrait 1080x1620) and writes them into outDir. */
export async function encode({ here, coversDir, frames, profileDir, outDir, start, duration }) {
  const results = new Map();
  const server = await serve(here, coversDir, frames, results);
  const { proc, wsUrl } = await launchChrome(profileDir, 9334);
  const cdp = await connect(wsUrl);
  try {
    await cdp.send('Page.enable');
    for (const mode of ['landscape', 'portrait']) {
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:9444/encode.html?mode=${mode}&start=${start}&dur=${duration}` });
      let done = null;
      for (let i = 0; i < 600 && !done; i++) {
        await sleep(1000);
        done = await cdp.evaluate('window.__done ?? null').catch(() => null);
      }
      if (done !== true) throw new Error(`encoding ${mode} failed: ${done ?? 'timeout'}`);
      const index = JSON.parse(results.get(`/out/${mode}.json`).toString());
      const file = join(outDir, `trailer-${mode}.mp4`);
      writeFileSync(file, mux(index, results.get(`/out/${mode}.h264`)));
      console.log(`${file}: ${index.width}x${index.height}, ${(index.samples.length / index.fps).toFixed(2)} s`);
    }
  } finally {
    cdp.close();
    proc.kill();
    server.close();
  }
}
