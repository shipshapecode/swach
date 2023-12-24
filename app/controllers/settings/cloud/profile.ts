import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

import type Session from 'ember-simple-auth/services/session';

export default class SettingsAccountController extends Controller {
  @service declare session: Session;

  @tracked loading = false;

  @action
  async logOut(): Promise<void> {
    this.loading = true;
    await this.session.invalidate();
    this.loading = false;
  }
}
