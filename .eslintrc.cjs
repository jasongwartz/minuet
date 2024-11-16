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
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  ignorePatterns: ['dist'],

  settings: {
    'import/resolver': {
      // Source: https://github.com/import-js/eslint-plugin-import/issues/2765#issuecomment-2143384052
      typescript: {
        project: __dirname,
      },
      node: true,
    },
  },

  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    'simple-import-sort/imports': 'error',
    camelcase: ['error', { properties: 'always' }],
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',

    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    // TODO: Add additional config `overrides: { namedExports: 'ignore' }` based on https://eslint.org/docs/latest/rules/func-style
    // after upgrading to eslint 9+, so that eslint will prefer arrow functions but still allow named function exports.

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
    {
      // shadcn generated components
      files: ['./src/ui/components/shadcn-ui/**/*.{ts,tsx}'],
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          {
            '**/*.{jsx,tsx}': 'KEBAB_CASE',
          },
        ],
      },
    },
  ],
}
