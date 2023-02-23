import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import CognitoService from 'ember-cognito/services/cognito';

export default class RegisterComponent extends Component {
  @service declare cognito: CognitoService;
  @service declare router: Router;

  @tracked errorMessage?: string;
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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Register: typeof RegisterComponent;
  }
}
