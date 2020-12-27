import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import ApplicationController from 'swach/controllers/application';
import { SettingsStorage } from 'swach/storages/settings';

export default class WelcomeController extends Controller {
  @controller application!: ApplicationController;

  @storageFor('settings') settings!: SettingsStorage;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    welcome: WelcomeController;
  }
}
