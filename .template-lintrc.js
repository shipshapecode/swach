'use strict';

module.exports = {
  plugins: ['ember-template-lint-plugin-prettier'],
  extends: ['octane', 'ember-template-lint-plugin-prettier:recommended'],
  rules: {
    'no-curly-component-invocation': {
      allow: ['context-menu', 'liquid-outlet', 'svg-jar']
    },
    'no-implicit-this': { allow: ['context-menu', 'liquid-outlet'] },
    'no-inline-styles': false,
    'no-invalid-interactive': false
  }
};
