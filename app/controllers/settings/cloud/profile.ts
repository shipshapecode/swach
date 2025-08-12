import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import type Session from 'swach/services/session';

export default class SettingsCloudProfileController extends Controller {
  @service declare session: Session;

  @tracked loading = false;

  @action
  logOut() {
    this.loading = true;
    this.session.invalidate();
    this.loading = false;
  }
}
