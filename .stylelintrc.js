'use strict';

module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-deprecated': [true, { ignoreAtRules: ['/^view/', 'apply'] }],
  },
};
