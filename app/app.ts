import Application from '@ember/application';
import { InitSentryForEmber } from '@sentry/ember';
import loadInitializers from 'ember-load-initializers';
import emberOrbitRegistry from 'ember-orbit/registry';
import Resolver from 'ember-resolver';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';
import compatModules from '@embroider/virtual/compat-modules';
import config from 'swach/config/environment';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

InitSentryForEmber();

const modules = { ...compatModules, ...emberOrbitRegistry('swach') };

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(modules);
}

loadInitializers(App, config.modulePrefix, compatModules);
