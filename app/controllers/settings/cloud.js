import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class SettingsAccountController extends Controller {
  @service session;

  @action
  logOut() {
    this.session.invalidate();
  }
}
