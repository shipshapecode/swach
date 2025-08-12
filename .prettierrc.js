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

module.exports = {
  plugins: [
    'prettier-plugin-ember-template-tag',
    '@ianvs/prettier-plugin-sort-imports',
  ],
  importOrder,
  importOrderParserPlugins,
  overrides: [
    {
      files: '*.{js,gjs,ts,gts,mjs,mts,cjs,cts}',
      options: { singleQuote: true, templateSingleQuote: false },
    },
    { files: '*.{yaml,yml}', options: { singleQuote: true } },
  ],
};
