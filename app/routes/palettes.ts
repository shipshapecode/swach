import type Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import type { LiveQuery, Store } from 'ember-orbit';
import type Session from 'ember-simple-auth/services/session';

import type { SettingsStorage } from 'swach/storages/settings';

export default class PalettesRoute extends Route {
  @service declare session: Session;
  @service declare store: Store;

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
        .sort('index'),
    );
  }
}
