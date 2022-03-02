import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  model(): LiveQuery {
    return this.store.cache.liveQuery((qb) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: false })
        .sort('index')
    );
  }
}
