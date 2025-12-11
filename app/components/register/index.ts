import { action } from '@ember/object';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import Session from 'ember-simple-auth/services/session';

export default class RegisterComponent extends Component {
  @service declare session: Session;
  @service declare router: Router;

  @tracked errorMessage?: string;
  @tracked password?: string;
  @tracked username?: string;

  @action
  async register(): Promise<void> {
    const { username, password } = this;
    if (username && password) {
      try {
        await this.session.authenticate('authenticator:supabase', {
          username,
          password,
          isSignUp: true,
        });

        this.router.transitionTo('settings.cloud');
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
