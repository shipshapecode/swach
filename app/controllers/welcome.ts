import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import type ApplicationController from '../controllers/application.ts';
import type { SettingsStorage } from '../storages/settings.ts';

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
