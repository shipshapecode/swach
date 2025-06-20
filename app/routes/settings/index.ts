import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';

import type Session from 'swach/services/session';
import type { SettingsStorage } from 'swach/storages/settings';
import viewTransitions from 'swach/utils/view-transitions';

export default class SettingsIndexRoute extends Route {
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
