import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';

export default class SettingsController extends Controller {
  @controller application;

  @action
  goBack() {
    window.history.back();
  }
}
