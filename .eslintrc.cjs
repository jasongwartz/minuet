/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },

  parser: '@typescript-eslint/parser',

  parserOptions: {
    projectService: true,
    tsconfigRootDir: __dirname,
  },

  plugins: ['@typescript-eslint', 'simple-import-sort', 'react-refresh', 'check-file'],

  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist'],

  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'simple-import-sort/imports': 'error',
    camelcase: ['error', { properties: 'always' }],
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    'func-style': ['error', 'expression'],

    '@typescript-eslint/only-throw-error': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_.*$' }], // Specifically allow variables with a leading "_" as placeholder argument names

    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
      },
    ],
    'import/no-cycle': 'error',
    'check-file/filename-naming-convention': [
      'error',
      {
        // Matches all JS/TS files, except .d.ts
        '**/!(*.d).{js,ts}': 'SNAKE_CASE',
        // Matches only .d.ts
        '**/*.d.ts': 'KEBAB_CASE',
        // Matches component files
        '**/*.{jsx,tsx}': 'PASCAL_CASE',
      },
      { ignoreMiddleExtensions: true },
    ],
  },
  overrides: [
    {
      files: ['./**/*.js', './**/*.mjs', './**/*.cjs'],
      env: { node: true },
      extends: ['plugin:@typescript-eslint/disable-type-checked'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
