import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type CognitoService from 'ember-cognito/services/cognito';

export default class RegisterConfirm extends Component {
  @service declare cognito: CognitoService;
  @service declare router: Router;

  @tracked errorMessage?: string;
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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RegisterConfirm: typeof RegisterConfirm;
  }
}
