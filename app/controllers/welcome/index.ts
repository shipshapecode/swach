import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import type ApplicationController from 'swach/controllers/application';
import type { SettingsStorage } from 'swach/storages/settings';

export default class WelcomeIndexController extends Controller {
  @controller application!: ApplicationController;

  @storageFor('settings') settings!: SettingsStorage;
}
