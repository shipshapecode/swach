'use strict';

module.exports = {
  extends: 'recommended',
  rules: {
    'no-implicit-this': { allow: ['context-menu', 'liquid-outlet'] },
    'no-inline-styles': false,
    'no-invalid-interactive': false
  }
};
