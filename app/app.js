import Application from '@ember/application';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations';

Sentry.init({
  dsn: 'https://6974b46329f24dc1b9fca4507c65e942@sentry.io/3956140',
  integrations: [new Integrations.Ember()]
});

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
