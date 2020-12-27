import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import Session from 'ember-simple-auth/services/session';

export default class Login extends Component {
  @service router!: Router;
  @service session!: Session;

  @tracked errorMessage = null;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async authenticate(): Promise<void> {
    const { username, password } = this;
    const credentials = { username, password };
    try {
      await this.session.authenticate('authenticator:cognito', credentials);
      this.router.transitionTo('settings.cloud');
    } catch (error) {
      this.errorMessage = error.message || error;
    }
  }
}
