'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  let app = new EmberApp(defaults, {
    autoImport: {
      forbidEval: true
    },
    babel: {
      plugins: ['@babel/plugin-proposal-object-rest-spread']
    },
    postcssOptions: {
      compile: {
        extension: 'scss',
        enabled: true,
        parser: require('postcss-scss'),
        syntax: 'postcss-scss',
        plugins: [
          {
            module: require('@csstools/postcss-sass'),
            options: {
              includePaths: ['node_modules/three-dots/sass']
            }
          },
          require('tailwindcss')('./tailwind.config.js')
        ]
      }
    },
    sourcemaps: {
      enabled: true
    }
  });

  const { Webpack } = require('@embroider/webpack');
  //const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  return require('@embroider/compat').compatBuild(app, Webpack, {
    // staticAddonTestSupportTrees: true,
    // staticAddonTrees: true,
    // staticHelpers: true,
    // staticComponents: true,
    packagerOptions: {
      webpackConfig: {
        devtool: false,
        node: { crypto: true }
      }
    }
  });
};
