import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const BANNED_FOR_LOGIC = ['phaser', '@/scene/*', '@/ui/*', '**/scene/*', '**/ui/*'];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'scripts/**/*.mjs'],
    rules: {
      'max-lines': ['warn', { max: 100 }],
      'max-lines-per-function': ['error', { max: 40 }],
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
    // Game logic must stay free of Phaser, DOM and presentation layers.
    files: ['src/core/**/*.ts', 'src/systems/**/*.ts', 'src/data/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: BANNED_FOR_LOGIC }],
      'no-restricted-globals': ['error', 'document', 'window', 'localStorage'],
    },
  },
);
