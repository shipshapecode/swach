'use strict';

module.exports = {
  singleQuote: true,
  spaceBeforeFunctionParen: false,
  trailingComma: 'none',
  overrides: [
    {
      files: '**/*.hbs',
      options: {
        parser: 'glimmer',
        singleQuote: false
      }
    }
  ]
};
