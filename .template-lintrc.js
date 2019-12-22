'use strict';

module.exports = {
  extends: 'octane',
  rules: {
    'no-curly-component-invocation': { allow: ['context-menu', 'liquid-outlet', 'svg-jar'] },
    'no-implicit-this': { allow: ['context-menu', 'liquid-outlet'] },
    'no-inline-styles': false,
    'no-invalid-interactive': false
  }
};
