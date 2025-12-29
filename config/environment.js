'use strict';

const version = require('../package').version;

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'swach',
    environment,
    rootURL: process.env.EMBER_CLI_ELECTRON ? '' : '/',
    locationType: process.env.EMBER_CLI_ELECTRON ? 'hash' : 'history',
    EmberENV: {
      // TODO: we should set this to false and fix things
      // EXTEND_PROTOTYPES: false,
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. EMBER_NATIVE_DECORATOR_SUPPORT: true
      },
    },

    // The indexedDB schema version. We can increment this to run migrations.
    SCHEMA_VERSION: 3,

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    api: {
      host: 'https://n3tygwauml.execute-api.us-east-2.amazonaws.com/prod',
    },

    supabase: {
      url: process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    },
    flashMessageDefaults: {
      injectionFactories: [],
    },
    orbit: {
      skipValidatorService: true,
    },
  };

  ENV['@sentry/ember'] = {
    sentry: {
      environment,
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
    // ENV.api.host = 'https://jpuj8ukmx8.execute-api.us-east-2.amazonaws.com/dev';
    // ENV.supabase = {
    //   url: 'https://dev-project-ref.supabase.co',
    //   anonKey: 'dev-anon-key',
    // };
    // ENV.supabase = {
    //   url: 'https://dev-project-ref.supabase.co',
    //   anonKey: 'dev-anon-key',
    // };
    ENV.orbit.skipValidatorService = false;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
    ENV.api.host = 'http://localhost:3000';
  }

  if (environment === 'production') {
    ENV.api.host =
      'https://n3tygwauml.execute-api.us-east-2.amazonaws.com/prod';

    ENV.supabase = {
      url: process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    };

    ENV['@sentry/ember'].sentry.dsn =
      'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140';
    ENV['@sentry/ember'].sentry.release = `v${version}`;
  }

  return ENV;
};
