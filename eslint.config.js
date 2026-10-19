import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Only presentation files know Phaser and the DOM; everything else must also run in Node (tests, simulator).
// shared/browser.ts (loop, autosave, localStorage), platform/crazygames.ts and platform/poki.ts (the platform SDKs) are
// the other places that touch the browser.
const PRESENTATION_FILES = ['src/**/*-view.ts', 'src/**/*-scene.ts', 'src/main.ts', 'src/shared/browser.ts', 'src/platform/crazygames.ts', 'src/platform/poki.ts'];
const BANNED_FOR_LOGIC = ['phaser', '**/*-view', '**/*-scene'];

export default tseslint.config(
  { ignores: ['dist', 'dist-poki', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.mjs'],
    rules: {
      'max-lines': ['warn', { max: 300 }],
      'max-lines-per-function': ['error', { max: 60 }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'no-console': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    // Node 22 has fetch, WebSocket, URL and the timers built in (scripts/trailer drives Chrome with them).
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', fetch: 'readonly', WebSocket: 'readonly', URL: 'readonly', setTimeout: 'readonly' },
    },
    rules: { 'no-console': 'off' },
  },
  {
    // describe() blocks are long by nature; file length is still guarded.
    files: ['tests/**/*.ts'],
    rules: { 'max-lines-per-function': 'off' },
  },
  {
    // Game logic must stay free of Phaser, DOM and presentation files.
    files: ['src/**/*.ts'],
    ignores: PRESENTATION_FILES,
    rules: {
      'no-restricted-imports': ['error', { patterns: BANNED_FOR_LOGIC }],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage'],
    },
  },
);
