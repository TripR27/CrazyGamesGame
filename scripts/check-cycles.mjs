// Fails when files in src/ import each other in a circle. Type-only imports do not count: they vanish at runtime.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const SRC = resolve('src');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith('.ts')) yield path;
  }
}

const isValueImport = (node) => {
  const clause = node.importClause;
  if (clause === undefined) return true;
  if (clause.isTypeOnly) return false;
  const named = clause.namedBindings;
  const onlyTypes = clause.name === undefined && named !== undefined && ts.isNamedImports(named) && named.elements.every((e) => e.isTypeOnly);
  return !onlyTypes;
};

function resolveImport(from, spec) {
  if (spec.startsWith('@/')) return join(SRC, `${spec.slice(2)}.ts`);
  if (spec.startsWith('.')) return resolve(dirname(from), `${spec}.ts`);
  return undefined;
}

const graph = new Map();
for (const file of walk(SRC)) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022);
  const targets = source.statements
    .filter((s) => ts.isImportDeclaration(s) && isValueImport(s))
    .map((s) => resolveImport(file, s.moduleSpecifier.text))
    .filter((t) => t !== undefined);
  graph.set(file, targets);
}

// Tarjan's strongly connected components: any component with more than one file is a cycle.
let index = 0;
const state = new Map();
const stack = [];
const cycles = [];
function visit(file) {
  const node = { index: index++, low: 0, onStack: true };
  node.low = node.index;
  state.set(file, node);
  stack.push(file);
  for (const next of graph.get(file) ?? []) {
    if (!graph.has(next)) continue;
    if (!state.has(next)) {
      visit(next);
      node.low = Math.min(node.low, state.get(next).low);
    } else if (state.get(next).onStack) node.low = Math.min(node.low, state.get(next).index);
  }
  if (node.low !== node.index) return;
  const group = [];
  let top;
  do {
    top = stack.pop();
    state.get(top).onStack = false;
    group.push(top);
  } while (top !== file);
  if (group.length > 1) cycles.push(group);
}
for (const file of graph.keys()) if (!state.has(file)) visit(file);

for (const group of cycles) console.error(`ERROR: import cycle between ${group.map((f) => relative(SRC, f)).join(', ')}`);
if (cycles.length > 0) process.exit(1);
console.log(`check-cycles: no import cycles in ${graph.size} files`);
