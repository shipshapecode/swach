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

export default {
  plugins: [
    'prettier-plugin-ember-template-tag',
    '@ianvs/prettier-plugin-sort-imports',
  ],
  importOrder,
  importOrderParserPlugins,
  singleQuote: true,
  overrides: [
    {
      files: ['*.js', '*.ts', '*.cjs', '.mjs', '.cts', '.mts', '.cts'],
      options: {
        trailingComma: 'es5',
      },
    },
    {
      files: ['*.html'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.json'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.hbs'],
      options: {
        singleQuote: false,
      },
    },
    {
      files: ['*.gjs', '*.gts'],
      options: {
        templateSingleQuote: false,
        trailingComma: 'es5',
      },
    },
  ],
};
