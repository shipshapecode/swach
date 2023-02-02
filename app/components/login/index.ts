import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import { storageFor } from 'ember-local-storage';
import Session from 'ember-simple-auth/services/session';

import config from 'swach/config/environment';
import { SettingsStorage } from 'swach/storages/settings';

export default class LoginComponent extends Component {
  @service declare router: Router;
  @service declare session: Session;

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

      // We want to skip this in tests, since once a user has logged in routes become inaccessible
      if (config.environment !== 'test') {
        this.settings.set('userHasLoggedInBefore', true);
      }

      this.router.transitionTo('settings.cloud');
    } catch (error) {
      this.errorMessage = error.message || error;
    } finally {
      this.loading = false;
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Login: typeof LoginComponent;
  }
}
