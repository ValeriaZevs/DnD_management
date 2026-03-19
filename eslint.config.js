const js = require('@eslint/js');
const globals = require('globals');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  js.configs.recommended,
  ...compat.extends('airbnb-base'),
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      'no-param-reassign': ['error', { props: false }],
      'import/extensions': ['error', 'always', { js: 'never' }],
      'no-underscore-dangle': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'eslint.config.js'],
  },
];
