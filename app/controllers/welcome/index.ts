import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import type ApplicationController from '../../controllers/application.ts';
import type { SettingsStorage } from '../../storages/settings.ts';

export default class WelcomeIndexController extends Controller {
  @controller application!: ApplicationController;

  @storageFor('settings') settings!: SettingsStorage;
}
