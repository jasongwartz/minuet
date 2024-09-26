/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },

  plugins: ['@typescript-eslint', 'simple-import-sort', 'react-refresh'],

  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],

  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'simple-import-sort/imports': 'error',
    camelcase: ['error', { properties: 'always' }],
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'func-style': ['error', 'expression'],

    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
  },
}
