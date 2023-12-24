'use strict';

const { configs } = require('@nullvoxpopuli/eslint-configs');

const config = configs.ember();

module.exports = {
  ...config,
  overrides: [
    ...config.overrides,
    {
      extends: ['plugin:prettier/recommended'],
      files: ['**/*.{js,gts,ts}'],
      rules: {
        'simple-import-sort/imports': 'off',
        'prefer-rest-params': 'off',
        'require-yield': 'off',
        'ember/no-array-prototype-extensions': 'off',
      },
    },
    // Electron files
    {
      files: ['./electron-app/**/*.js'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      globals: {
        document: false,
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
            allowModules: ['ember-electron', 'electron'],
          },
        ],
        'n/no-missing-require': [
          'error',
          {
            allowModules: ['electron'],
          },
        ],
      },
    },
  ],
};
