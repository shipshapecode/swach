'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    autoImport: {
      forbidEval: true,
    },
    babel: {
      plugins: ['@babel/plugin-proposal-object-rest-spread'],
    },
    'ember-cli-babel': {
      enableTypeScriptTransform: true,
    },
    postcssOptions: {
      compile: {
        enabled: true,
        plugins: [
          require('postcss-import')(),
          require('tailwindcss')('./tailwind.config.js'),
        ],
      },
    },
    sourcemaps: {
      enabled: true,
    },
  });

  if (process.platform !== 'win32') {
    const { Webpack } = require('@embroider/webpack');

    //const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    return require('@embroider/compat').compatBuild(app, Webpack, {
      staticAddonTestSupportTrees: true,
      staticAddonTrees: true,
      staticHelpers: true,
      staticComponents: true,
      packagerOptions: {
        webpackConfig: {
          devtool: false,
          resolve: {
            fallback: {
              crypto: require.resolve('crypto-browserify'),
              stream: require.resolve('stream-browserify'),
            },
          },
        },
      },
    });
  } else {
    return app.toTree();
  }
};
