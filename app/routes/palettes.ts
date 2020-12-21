import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model() {
    return this.store.cache.liveQuery((qb) => qb.findRecords('palette'));
  }
}
