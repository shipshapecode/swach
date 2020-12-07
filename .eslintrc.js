'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: ['ember'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended'
  ],
  env: {
    browser: true
  },
  globals: {
    requireNode: false
  },
  rules: {
    'ember/no-jquery': 'error',
    'require-yield': 'off',
    'ember/classic-decorator-hooks': 'error',
    'ember/classic-decorator-no-classic-methods': 'error'
  },
  overrides: [
    // node files
    {
      files: [
        '.eslintrc.js',
        '.prettierrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'tailwind.config.js',
        'testem.js',
        'testem-electron.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'electron-app/**/*.js',
        'lib/*/index.js',
        'server/**/*.js'
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
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
      rules: {
        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'no-console': 'off',
        'node/no-unpublished-require': 'off',
        'node/no-extraneous-require': [
          'error',
          {
            allowModules: ['ember-electron', 'electron']
          }
        ],
        'node/no-missing-require': [
          'error',
          {
            allowModules: ['electron', 'ember-electron', 'menubar']
          }
        ]
      }
    }
  ]
};
