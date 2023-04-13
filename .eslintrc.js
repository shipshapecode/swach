'use strict';

module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }]
      ]
    }
  },
  plugins: ['ember'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
    '@clark/ember-order-imports'
  ],
  env: {
    browser: true
  },
  globals: {
    requireNode: false
  },
  rules: {
    'require-yield': 'off',
    'sort-imports': [
      'error',
      { allowSeparatedGroups: true, ignoreDeclarationSort: true }
    ],
    'ember/no-array-prototype-extensions': 'off'
  },
  overrides: [
    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.stylelintrc.js',
        './.template-lintrc.js',
        './babel.config.js',
        './ember-cli-build.js',
        './tailwind.config.js',
        './testem.js',
        './testem-electron.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './electron-app/**/*.js',
        './lib/*/index.js',
        './server/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      globals: {
        document: false
      },
      extends: ['plugin:n/recommended'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'no-console': 'off',
        'n/no-unpublished-require': 'off',
        'n/no-extraneous-require': [
          'error',
          {
            allowModules: ['ember-electron', 'electron']
          }
        ],
        'n/no-missing-require': [
          'error',
          {
            allowModules: ['electron']
          }
        ]
      }
    },
    // Typescript files
    {
      parser: '@typescript-eslint/parser',
      files: ['app/**/*.ts', 'tests/**/*.ts'],
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'prefer-rest-params': 'off'
      }
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended']
    }
  ]
};
