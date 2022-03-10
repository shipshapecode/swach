import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import Session from 'ember-simple-auth/services/session';

export default class SettingsDataRoute extends Route {
  @service session!: Session;

  beforeModel(transition: Transition): void {
    this.session.requireAuthentication(transition, 'settings.cloud.login');
  }
}
