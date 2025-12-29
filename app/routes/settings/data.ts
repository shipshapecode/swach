import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';

import type Session from '../../services/session.ts';
import type { SettingsStorage } from '../../storages/settings.ts';
import viewTransitions from '../../utils/view-transitions.ts';

export default class SettingsDataRoute extends Route {
  @service declare session: Session;

  @storageFor('settings') settings!: SettingsStorage;

  beforeModel(transition: Transition): void {
    if (this.settings.get('userHasLoggedInBefore')) {
      this.session.requireAuthentication(transition, 'settings.cloud.login');
    }
  }

  async afterModel() {
    await viewTransitions();
  }
}
