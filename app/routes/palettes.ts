import Transition from '@ember/routing/-private/transition';
import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';
import Session from 'ember-simple-auth/services/session';

export default class PalettesRoute extends Route {
  @service session!: Session;
  @service store!: Store;

  beforeModel(transition: Transition): void {
    this.session.requireAuthentication(transition, 'settings.cloud.login');
  }

  model(): LiveQuery {
    return this.store.cache.liveQuery((qb) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: false })
        .sort('index')
    );
  }
}
