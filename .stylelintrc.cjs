'use strict';

module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-deprecated': [true, { ignoreAtRules: ['/^view/', 'apply'] }],
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['plugin', 'reference', 'theme'] },
    ],
    'custom-property-empty-line-before': null,
    'custom-property-pattern': null,
    'declaration-empty-line-before': null,
    'import-notation': null,
  },
};
