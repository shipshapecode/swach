import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import 'swach/components/toggle-switch';
import type ApplicationController from 'swach/controllers/application';
import type { SettingsStorage } from 'swach/storages/settings';

export default class WelcomeAutoStartController extends Controller {
  @controller application!: ApplicationController;

  @storageFor('settings') settings!: SettingsStorage;
}
