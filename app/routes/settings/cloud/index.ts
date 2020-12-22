import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import CognitoService from 'ember-cognito/services/cognito';
import Session from 'ember-simple-auth/services/session';
import Transition from '@ember/routing/-private/transition';

export default class SettingsAccountRoute extends Route {
  @service cognito!: CognitoService;
  @service session!: Session;

  async beforeModel(transition: Transition): Promise<Transition> {
    if (!this.session.isAuthenticated) {
      transition.abort();
      return this.transitionTo('settings.cloud.login');
    }

    return this.transitionTo('settings.cloud.profile');
  }
}
