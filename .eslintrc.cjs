/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },

  plugins: [
    '@typescript-eslint',
    'simple-import-sort',
    'react-refresh'
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],

  'rules': {
    indent: 'off',
    '@typescript-eslint/indent': ['error',2],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error','always'],
    'array-bracket-spacing': ['error', 'never'],
    'array-element-newline': ['error', 'consistent'],
    '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': ['error'],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
    'no-mixed-spaces-and-tabs': ['error'],
    '@typescript-eslint/consistent-type-imports': 'error',
    'simple-import-sort/imports': 'error',
    'camelcase': ['error', {properties: 'always'}],
    'eqeqeq': ['error', 'always'],
    'prefer-const': 'error',
    'func-style': ['error', 'expression'],

    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
