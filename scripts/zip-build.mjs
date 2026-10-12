// Zips the production build for CrazyGames: `npm run zip` (after `npm run build`) writes release/brewmasters-tavern.zip
// with index.html at the top. No dependency: Node's zlib deflates, the zip records are written here. Paths use forward
// slashes (Windows' Compress-Archive writes backslashes, which unpack as flat file names on a Linux server).
import { Buffer } from 'node:buffer';
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const SOURCE = 'dist';
const TARGET = join('release', 'brewmasters-tavern.zip');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function filesUnder(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/** One file: its local header plus data, and its central-directory record (MS-DOS date fixed at 2026-01-01). */
function entry(name, data, offset) {
  const packed = deflateRawSync(data, { level: 9 });
  const nameBytes = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(date, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  central.writeUInt32LE(offset, 42);
  return { body: Buffer.concat([local, nameBytes, packed]), central: Buffer.concat([central, nameBytes]) };
}

const files = filesUnder(SOURCE).sort();
if (!files.some((f) => relative(SOURCE, f) === 'index.html')) throw new Error('No dist/index.html: run `npm run build` first.');
const bodies = [];
const centrals = [];
let offset = 0;
for (const file of files) {
  const { body, central } = entry(relative(SOURCE, file).split(sep).join('/'), readFileSync(file), offset);
  bodies.push(body);
  centrals.push(central);
  offset += body.length;
}
const directory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
mkdirSync('release', { recursive: true });
const zip = Buffer.concat([...bodies, directory, end]);
writeFileSync(TARGET, zip);
console.log(`zip-build: ${TARGET}, ${files.length} files, ${(zip.length / 1024).toFixed(0)} KB`);
