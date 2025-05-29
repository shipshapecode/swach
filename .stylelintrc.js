'use strict';

module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: { 'scss/at-rule-no-unknown': [true, { ignoreAtRules: ['tailwind'] }] },
};
