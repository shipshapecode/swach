'use strict';

const testing = [
  '^ember-cli-htmlbars($|\\/)',
  '^qunit',
  '^ember-qunit',
  '^@ember/test-helpers',
  '^ember-exam',
  '^ember-cli-mirage',
  '^sinon',
  '^ember-sinon-qunit',
  '^(@[^\\/]+\\/)?[^\\/]+\\/test-support($|\\/)',
].join('|');

const emberCore = [
  '^ember$',
  '^@ember\\/',
  '^ember-data($|\\/)',
  '^@ember-data\\/',
  '^@glimmer\\/',
  '^require$',
].join('|');

const emberAddons = ['^@?ember-', '^@[^\\/]+\\/ember($|\\/|-)'].join('|');

const swachInternals = ['^swach/(.*)$', '^[./]'].join('|');

const importOrder = [
  testing,
  emberCore,
  emberAddons,
  '<THIRD_PARTY_MODULES>',
  swachInternals,
];
const importOrderParserPlugins = ['typescript', 'decorators-legacy'];
const importOrderSeparation = true;
const importOrderSortSpecifiers = true;

module.exports = {
  plugins: [
    'prettier-plugin-ember-template-tag',
    require('@trivago/prettier-plugin-sort-imports'),
  ],
  importOrder,
  importOrderParserPlugins,
  importOrderSeparation,
  importOrderSortSpecifiers,
  overrides: [
    {
      files: ['**/*.hbs'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: '*.{js,ts,gjs,gts}',
      options: {
        singleQuote: true,
      },
    },
    {
      files: '*.{yaml,yml}',
      options: {
        singleQuote: true,
      },
    },
  ],
};

exports.importOrder = importOrder;
exports.importOrderParserPlugins = importOrderParserPlugins;
exports.importOrderSeparation = importOrderSeparation;
exports.importOrderSortSpecifiers = importOrderSortSpecifiers;
