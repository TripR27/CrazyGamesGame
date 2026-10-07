import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Only presentation files know Phaser and the DOM; everything else must also run in Node (tests, simulator).
const PRESENTATION_FILES = ['src/**/*-view.ts', 'src/**/*-scene.ts', 'src/main.ts', 'src/shared/browser.ts'];
const BANNED_FOR_LOGIC = ['phaser', '**/*-view', '**/*-scene'];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
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
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
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
