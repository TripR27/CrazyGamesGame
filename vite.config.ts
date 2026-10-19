import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** The platform's SDK script for index.html: Poki's with `--mode poki` (build:poki, dev:poki), CrazyGames' otherwise. */
const SDK_SCRIPTS = {
  crazygames: 'https://sdk.crazygames.com/crazygames-sdk-v3.js',
  poki: 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js',
};

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    {
      name: 'platform-sdk',
      transformIndexHtml: (html: string) =>
        html.replace('<!-- platform-sdk -->', `<script src="${mode === 'poki' ? SDK_SCRIPTS.poki : SDK_SCRIPTS.crazygames}"></script>`),
    },
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  test: { include: ['tests/**/*.test.ts'] },
}));
