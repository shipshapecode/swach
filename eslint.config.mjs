/**
 * Debugging:
 *   https://eslint.org/docs/latest/use/configure/debug
 *  ----------------------------------------------------
 *
 *   Print a file's calculated configuration
 *
 *     npx eslint --print-config path/to/file.js
 *
 *   Inspecting the config
 *
 *     npx eslint --inspect-config
 *
 */
import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import ember from 'eslint-plugin-ember/recommended';
import n from 'eslint-plugin-n';
import qunit from 'eslint-plugin-qunit';
import globals from 'globals';
import ts from 'typescript-eslint';

const parserOptions = {
  esm: {
    js: {
      ecmaFeatures: { modules: true },
      ecmaVersion: 'latest',
      requireConfigFile: false,
      babelOptions: {
        plugins: [
          [
            '@babel/plugin-proposal-decorators',
            { decoratorsBeforeExport: true },
          ],
        ],
      },
    },
    ts: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
};

export default ts.config(
  js.configs.recommended,
  ember.configs.base,
  ember.configs.gjs,
  ember.configs.gts,
  eslintConfigPrettier,
  /**
   * Ignores must be in their own object
   * https://eslint.org/docs/latest/use/configure/ignore
   */
  {
    ignores: [
      'declarations/',

      // ember-electron
      'electron-app/node_modules/',
      'electron-app/out/',
      'electron-app/ember-dist/',
      'electron-app/ember-test/',
      'electron-out/',

      // Sentry
      'electron-app/sentry-symbols.js',

      'dist/',
      'node_modules/',
      'coverage/',
      'types/',
      '!**/.*',
    ],
  },
  /**
   * https://eslint.org/docs/latest/use/configure/configuration-files#configuring-linter-options
   */
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  { files: ['**/*.js'], languageOptions: { parser: babelParser } },
  {
    files: ['**/*.{js,gjs}'],
    languageOptions: {
      parserOptions: parserOptions.esm.js,
      globals: { ...globals.browser },
    },
  },
  {
    files: ['**/*.{ts,gts}'],
    languageOptions: {
      parser: ember.parser,
      parserOptions: parserOptions.esm.ts,
    },
    extends: [...ts.configs.recommendedTypeChecked, ember.configs.gts],
    rules: {
      'prefer-rest-params': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  { files: ['tests/**/*-test.{js,gjs,ts,gts}'], plugins: { qunit } },
  /**
   * CJS node files
   */
  {
    files: [
      '**/*.cjs',
      'config/**/*.js',
      'electron-app/**/*.js',
      'tests/dummy/config/**/*.js',
      'testem.js',
      'testem*.js',
      'index.js',
      '.prettierrc.js',
      '.stylelintrc.js',
      '.template-lintrc.js',
      'ember-cli-build.js',
      'tailwind.config.js',
    ],
    plugins: { n },

    languageOptions: {
      sourceType: 'script',
      ecmaVersion: 'latest',
      globals: { ...globals.node },
    },
  },
  /**
   * ESM node files
   */
  {
    files: ['**/*.mjs'],
    plugins: { n },

    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: parserOptions.esm.js,
      globals: { ...globals.node },
    },
  },
);
