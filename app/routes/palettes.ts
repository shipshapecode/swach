import Route from '@ember/routing/route';
import type Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import { storageFor } from 'ember-local-storage';
import { orbit, type LiveQuery, type Store } from 'ember-orbit';
import type Session from 'swach/services/session';
import type { SettingsStorage } from 'swach/storages/settings';
import viewTransitions from 'swach/utils/view-transitions';

export default class PalettesRoute extends Route {
  @orbit declare store: Store;

  @service declare session: Session;

  @storageFor('settings') settings!: SettingsStorage;

  beforeModel(transition: Transition): void {
    if (this.settings.get('userHasLoggedInBefore')) {
      this.session.requireAuthentication(transition, 'settings.cloud.login');
    }
  }

  model(): LiveQuery {
    return this.store.cache.liveQuery((qb) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: false })
        .sort('index')
    );
  }

  async afterModel() {
    await viewTransitions();
  }
}
