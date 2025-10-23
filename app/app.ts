import Application from '@ember/application';
import { init as emberInit } from '@sentry/ember';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import {
  importSync,
  isDevelopingApp,
  isTesting,
  macroCondition,
} from '@embroider/macros';
import compatModules from '@embroider/virtual/compat-modules';
import { init } from '@sentry/electron/renderer';
import config from 'swach/config/environment';
import './styles/all.css';
import pkg from '../package.json';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

if (macroCondition(!isTesting())) {
  init(
    {
      dsn: 'https://6974b46329f24dc1b9fca4507c65e942@o361681.ingest.us.sentry.io/3956140',
      environment: config.environment,
      release: `v${pkg.version}`,
    },
    // @ts-expect-error TODO: fix this type error
    emberInit
  );
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
}

loadInitializers(App, config.modulePrefix, compatModules);
