'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const isProduction = EmberApp.env() === 'production';

const purgeCSS = {
  module: require('@fullhuman/postcss-purgecss'),
  options: {
    content: [
      // add extra paths here for components/controllers which include tailwind classes
      './app/index.html',
      './app/components/**/*.hbs',
      './app/templates/**/*.hbs'
    ],
    defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
  }
}

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
          require('postcss-nested'),
          ...isProduction ? [purgeCSS] : []
        ]
      }
    }
  });

  return app.toTree();
};
