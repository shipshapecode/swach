import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import CognitoService from 'ember-cognito/services/cognito';
import Router from '@ember/routing/router-service';
import Session from 'ember-simple-auth/services/session';

export default class ForgotPasswordComponent extends Component {
  @service cognito!: CognitoService;
  @service router!: Router;
  @service session!: Session;

  @tracked code?: string;
  @tracked errorMessage?: string;
  @tracked isConfirming = false;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async forgotPassword(): Promise<void> {
    if (this.username) {
      try {
        await this.cognito.forgotPassword(this.username);

        this.isConfirming = true;
      } catch (err) {
        this.errorMessage = err.message;
      }
    }
  }

  @action
  async forgotPasswordSubmit(): Promise<void> {
    const { username, code, password } = this;

    if (username && code && password) {
      try {
        await this.cognito.forgotPasswordSubmit(username, code, password);

        this.router.transitionTo('settings.cloud');
      } catch (err) {
        this.errorMessage = err.message;
      }
    }
  }
}
