'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'swach',
    environment,
    rootURL: '/',
    locationType: 'auto',
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

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    // TODO: add CSP back. We need to figure out why it is making tests fail.
    // contentSecurityPolicy: {
    //   'default-src': ["'none'"],
    //   'script-src': [
    //     'http://localhost:7020',
    //     "'self'",
    //     "'unsafe-eval'",
    //     "'unsafe-inline'"
    //   ],
    //   'font-src': ["'self'"],
    //   'connect-src': ["'self'"],
    //   'img-src': ['data:', "'self'"],
    //   'style-src': ["'self'", "'unsafe-inline'"],
    //   'media-src': ["'self'"]
    // },
    // contentSecurityPolicyMeta: true
  };

  ENV['ember-cli-mirage'] = {
    enabled: false
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    ENV['ember-cli-mirage'] = {
      enabled: true
    };

    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
