'use strict';

module.exports = {
  extends: 'octane',
  rules: {
    'no-curly-component-invocation': { allow: ['context-menu', 'svg-jar'] },
    'no-implicit-this': { allow: ['context-menu'] },
    'no-inline-styles': false,
    'no-invalid-interactive': false
  }
};
