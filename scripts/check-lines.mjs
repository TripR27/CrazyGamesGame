import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const WARN_LINES = 100;
const FAIL_LINES = 120;
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

const files = DIRS.flatMap((dir) => [...walk(dir)]).map((file) => ({
  file,
  lines: countLines(readFileSync(file, 'utf8')),
}));
const warned = files.filter(({ lines }) => lines > WARN_LINES);
const failed = files.filter(({ lines }) => lines > FAIL_LINES);

for (const { file, lines } of warned) {
  const level = lines > FAIL_LINES ? 'ERROR' : 'warning';
  console.error(`${level}: ${file} has ${lines} lines (guideline ${WARN_LINES}, hard max ${FAIL_LINES})`);
}
if (failed.length > 0) process.exit(1);
console.log(`check-lines: no file over ${FAIL_LINES} lines (${warned.length} over ${WARN_LINES})`);
