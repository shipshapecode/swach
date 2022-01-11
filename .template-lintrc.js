'use strict';

module.exports = {
  plugins: ['ember-template-lint-plugin-prettier'],
  extends: ['recommended', 'ember-template-lint-plugin-prettier:recommended'],
  rules: {
    'no-curly-component-invocation': {
      allow: ['svg-jar', '-with-dynamic-vars']
    },
    'no-inline-styles': false,
    'no-invalid-interactive': false,
    'no-negated-condition': false,
    'no-outlet-outside-routes': false,
    'require-input-label': false,
    'require-presentational-children': false
  }
};
