import type Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';

import type CognitoService from 'ember-cognito/services/cognito';
import type Session from 'ember-simple-auth/services/session';

import viewTransitions from 'swach/utils/view-transitions';

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

  async afterModel() {
    await viewTransitions();
  }
}
