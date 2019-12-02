'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

// TODO: Figure out why PurgeCSS doesn't work with new ember-electron
// const isProduction = EmberApp.env() === 'production';
//
// const purgeCSS = {
//   module: require('@fullhuman/postcss-purgecss'),
//   options: {
//     content: [
//       // add extra paths here for components/controllers which include tailwind classes
//       './app/index.html',
//       './app/templates/**/*.hbs'
//     ],
//     defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
//   }
// };

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    babel: {
      plugins: [
        '@babel/plugin-proposal-object-rest-spread'
      ]
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
          // ...isProduction ? [purgeCSS] : []
        ]
      }
    }
  });

  app.import('node_modules/@simonwep/pickr/dist/themes/monolith.min.css');

  return app.toTree();
};
