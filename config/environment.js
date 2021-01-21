'use strict';

const version = require('../package').version;

module.exports = function (environment) {
  let ENV = {
    modulePrefix: 'swach',
    environment,
    rootURL: process.env.EMBER_CLI_ELECTRON ? getElectronRootURL() : '/',
    locationType: process.env.EMBER_CLI_ELECTRON ? 'hash' : 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    // The indexedDB schema version. We can increment this to run migrations.
    SCHEMA_VERSION: 2,

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    contentSecurityPolicy: {
      'default-src': ["'none'"],
      'script-src': [
        'http://localhost:7020',
        'http://localhost:7357',
        'http://testemserver',
        "'self'",
        "'unsafe-inline'"
      ],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'img-src': ['data:', "'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'media-src': ["'self'"]
    },
    contentSecurityPolicyMeta: true,
    cognito: {
      poolId: 'us-east-2_AEr5v3Ogt',
      clientId: '1jn23hlv9ggi63mc37f4m5hm4h'
    },
    featureFlags: {
      'cloud-login': true
    },
    sentry: {
      environment
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    ENV.featureFlags['cloud-login'] = false;
    ENV.sentry.dsn =
      'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140';
    ENV.sentry.release = `v${version}`;
  }

  return ENV;
};

function getElectronRootURL() {
  return process.env.EMBER_ENV === 'test' ? '../' : '';
}
