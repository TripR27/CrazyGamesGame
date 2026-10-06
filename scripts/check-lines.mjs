import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MAX_LINES = 100;
const DIRS = ['src', 'tests', 'scripts'];
const EXTENSIONS = new Set(['.ts', '.mjs', '.js', '.css', '.html', '.json']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(path))) yield path;
  }
}

const countLines = (text) => text.replace(/\r?\n$/, '').split(/\r?\n/).length;

const tooLong = DIRS.flatMap((dir) => [...walk(dir)])
  .map((file) => ({ file, lines: countLines(readFileSync(file, 'utf8')) }))
  .filter(({ lines }) => lines > MAX_LINES);

for (const { file, lines } of tooLong) {
  console.error(`${file}: ${lines} lines (max ${MAX_LINES})`);
}
if (tooLong.length > 0) process.exit(1);
console.log(`check-lines: all files within ${MAX_LINES} lines`);
