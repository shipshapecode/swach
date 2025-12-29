import Route from '@ember/routing/route';
import type Router from '@ember/routing/router-service';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';

import type Session from '../../../services/session.ts';
import viewTransitions from '../../../utils/view-transitions.ts';

export default class SettingsAccountRoute extends Route {
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
