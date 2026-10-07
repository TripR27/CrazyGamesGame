// Balance simulator: `npm run simulate [-- minutes [seed]]`.
// Vite (already a dev dependency) loads the TypeScript game code with its `@/` paths, so no extra runner is needed.
import { createServer } from 'vite';

const minutes = Number(process.argv[2] ?? 60);
const seed = Number(process.argv[3] ?? 1);

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { simulationReport } = await server.ssrLoadModule('/src/dev/simulator-report.ts');
  console.log(simulationReport({ minutes, seed }));
} finally {
  await server.close();
}
