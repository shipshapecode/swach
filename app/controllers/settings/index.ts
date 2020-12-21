import Controller, { inject as controller } from '@ember/controller';
import ApplicationController from 'swach/controllers/application';

export default class SettingsIndexController extends Controller {
  @controller application!: ApplicationController;
}
