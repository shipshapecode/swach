import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { service } from '@ember/service';

import CognitoService from 'ember-cognito/services/cognito';
import Session from 'ember-simple-auth/services/session';

export default class SettingsAccountRoute extends Route {
  @service declare cognito: CognitoService;
  @service declare router: Router;
  @service declare session: Session;

  async beforeModel(transition: Transition): Promise<Transition> {
    if (!this.session.isAuthenticated) {
      transition.abort();
      return this.router.transitionTo('settings.cloud.login');
    }

    return this.router.transitionTo('settings.cloud.profile');
  }
}
