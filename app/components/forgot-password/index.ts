import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import 'swach/components/loading-button';
import CognitoService from 'ember-cognito/services/cognito';
import Session from 'ember-simple-auth/services/session';

export default class ForgotPasswordComponent extends Component {
  @service declare cognito: CognitoService;
  @service declare router: Router;
  @service declare session: Session;

  @tracked code?: string;
  @tracked errorMessage?: string;
  @tracked isConfirming = false;
  @tracked loading = false;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async forgotPassword(): Promise<void> {
    if (this.username) {
      this.loading = true;
      try {
        await this.cognito.forgotPassword(this.username);

        this.isConfirming = true;
      } catch (err) {
        this.errorMessage = err.message;
      } finally {
        this.loading = false;
      }
    }
  }

  @action
  async forgotPasswordSubmit(): Promise<void> {
    const { username, code, password } = this;

    if (username && code && password) {
      this.loading = true;
      try {
        await this.cognito.forgotPasswordSubmit(username, code, password);

        this.router.transitionTo('settings.cloud');
      } catch (err) {
        this.errorMessage = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ForgotPassword: typeof ForgotPasswordComponent;
  }
}
