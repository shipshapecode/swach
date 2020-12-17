import Controller, { inject as controller } from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class SettingsController extends Controller {
  @controller application;
  @service session;

  @action
  goBack() {
    window.history.back();
  }
}
