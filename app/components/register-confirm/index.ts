import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import CognitoService from 'ember-cognito/services/cognito';

export default class RegisterConfirm extends Component {
  @service cognito!: CognitoService;
  @service router!: Router;

  @tracked errorMessage = null;
  @tracked code?: string;
  @tracked username?: string;

  @action
  async confirm(): Promise<void> {
    const { username, code } = this;

    if (username && code) {
      try {
        await this.cognito.confirmSignUp(username, code);

        this.router.transitionTo('settings.cloud');
      } catch (err) {
        this.errorMessage = err?.message;
      }
    }
  }
}
