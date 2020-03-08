'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    babel: {
      plugins: ['@babel/plugin-proposal-object-rest-spread']
    },
    postcssOptions: {
      compile: {
        extension: 'scss',
        syntax: 'postcss-scss',
        plugins: [
          {
            module: require('postcss-import'),
            options: {
              path: ['node_modules']
            }
          },
          require('tailwindcss')('./tailwind.config.js'),
          require('postcss-nested')
        ]
      }
    }
  });

  return app.toTree();
};
