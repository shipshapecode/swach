import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import Router from '@ember/routing/router-service';
import { service } from '@ember/service';

import CognitoService from 'ember-cognito/services/cognito';
import Session from 'ember-simple-auth/services/session';

export default class SettingsAccountRoute extends Route {
  @service cognito!: CognitoService;
  @service router!: Router;
  @service session!: Session;

  async beforeModel(transition: Transition): Promise<Transition> {
    if (!this.session.isAuthenticated) {
      transition.abort();
      return this.router.transitionTo('settings.cloud.login');
    }

    return this.router.transitionTo('settings.cloud.profile');
  }
}
