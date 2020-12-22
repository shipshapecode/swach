import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { LiveQuery, Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model(): Promise<LiveQuery> {
    return this.store.cache.liveQuery((qb) => qb.findRecords('palette'));
  }
}
