import Application from '@ember/application';

import { InitSentryForEmber } from '@sentry/ember';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';

import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

import config from 'swach/config/environment';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

InitSentryForEmber();

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
