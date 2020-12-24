import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import CognitoService from 'ember-cognito/services/cognito';
import Router from '@ember/routing/router-service';

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
