'use strict';

module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'at-rule-no-deprecated': [true, { ignoreAtRules: ['/^view/', 'apply'] }],
    'scss/at-rule-no-unknown': [true, { ignoreAtRules: ['tailwind'] }],
  },
};
