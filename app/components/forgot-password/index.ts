import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import CognitoService from 'ember-cognito/services/cognito';
import Router from '@ember/routing/router-service';

export default class ForgotPasswordIndex extends Component {
  @service cognito!: CognitoService;
  @service router!: Router;

  @tracked errorMessage?: string;
  @tracked username?: string;

  @action
  async forgotPassword() {
    if (this.username) {
      try {
        await this.cognito.forgotPassword(this.username);

        this.router.transitionTo('settings.cloud.forgot-password.confirm');
      } catch (err) {
        this.errorMessage = err.message;
      }
    }
  }
}
