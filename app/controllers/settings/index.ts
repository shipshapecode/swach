import Controller, { inject as controller } from '@ember/controller';

import type ApplicationController from '../../controllers/application.ts';

export default class SettingsIndexController extends Controller {
  @controller application!: ApplicationController;
}
