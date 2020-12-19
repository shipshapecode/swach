import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import CognitoService from 'ember-cognito/services/cognito';
import Router from '@ember/routing/router-service';

export default class Register extends Component {
  @service cognito!: CognitoService;
  @service router!: Router;

  @tracked errorMessage = null;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async register(): Promise<void> {
    const { username, password } = this;
    if (username && password) {
      const attributes = {
        email: username
      };

      try {
        await this.cognito.signUp(username, password, attributes);

        this.router.transitionTo('settings.cloud.register.confirm');
      } catch (err) {
        this.errorMessage = err?.message;
      }
    }
  }
}
