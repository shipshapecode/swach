import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import type Session from '../../../services/session.ts';

export default class SettingsCloudProfileController extends Controller {
  @service declare session: Session;

  @tracked loading = false;

  @action
  async logOut() {
    this.loading = true;
    await this.session.invalidate();
    this.loading = false;
  }
}
