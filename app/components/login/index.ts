import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { storageFor } from 'ember-local-storage';
import Session from 'ember-simple-auth/services/session';

import { SettingsStorage } from 'swach/storages/settings';

export default class Login extends Component {
  @service router!: Router;
  @service session!: Session;

  @storageFor('settings') settings!: SettingsStorage;

  @tracked errorMessage = null;
  @tracked loading = false;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async authenticate(): Promise<void> {
    this.loading = true;
    const { username, password } = this;
    const credentials = { username, password };
    try {
      await this.session.authenticate('authenticator:cognito', credentials);
      this.settings.set('userHasLoggedInBefore', true);
      this.router.transitionTo('settings.cloud');
    } catch (error) {
      this.errorMessage = error.message || error;
    } finally {
      this.loading = false;
    }
  }
}
