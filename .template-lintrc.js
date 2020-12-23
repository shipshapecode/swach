'use strict';

module.exports = {
  plugins: ['ember-template-lint-plugin-prettier'],
  extends: ['octane', 'ember-template-lint-plugin-prettier:recommended'],
  rules: {
    'no-curly-component-invocation': {
      allow: ['context-menu', 'svg-jar', '-with-dynamic-vars']
    },
    'no-implicit-this': { allow: ['context-menu'] },
    'no-inline-styles': false,
    'no-invalid-interactive': false,
    'no-outlet-outside-routes': false
  }
};
