/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: { project: './tsconfig.eslint.json' },
    },
    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
    rules: {},
  },
];
