import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class SettingsAccountRoute extends Route {
  @service cognito;
  @service session;

  async beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      transition.abort();
      return this.transitionTo('settings.cloud.login');
    }

    return this.transitionTo('settings.cloud.profile');
  }
}
