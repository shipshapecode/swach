'use strict';

require('dotenv').config();

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'Swach',
    environment,
    rootURL: process.env.EMBER_CLI_ELECTRON ? '' : '/',
    locationType: process.env.EMBER_CLI_ELECTRON ? 'hash' : 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
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

    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    flashMessageDefaults: {
      injectionFactories: [],
    },
    orbit: {
      skipValidatorService: true,
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
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

    // Use mock Supabase config for tests
    ENV.supabase = {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
    };
  }

  if (environment === 'production') {
    // Production Supabase config from environment variables
    ENV.supabase = {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
    };
  }

  return ENV;
};
