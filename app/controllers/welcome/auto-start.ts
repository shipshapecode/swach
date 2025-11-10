import Controller, { inject as controller } from '@ember/controller';

import { storageFor } from 'ember-local-storage';

import 'swach/components/toggle-switch';

import type ApplicationController from '../../controllers/application.ts';
import type { SettingsStorage } from '../../storages/settings.ts';

export default class WelcomeAutoStartController extends Controller {
  @controller application!: ApplicationController;

  @storageFor('settings') settings!: SettingsStorage;
}
