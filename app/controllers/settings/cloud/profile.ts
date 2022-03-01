import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

import Session from 'ember-simple-auth/services/session';

export default class SettingsAccountController extends Controller {
  @service session!: Session;

  @action
  logOut(): void {
    this.session.invalidate();
  }
}
