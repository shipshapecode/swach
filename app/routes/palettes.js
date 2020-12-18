import Route from '@ember/routing/route';

export default class PalettesRoute extends Route {
  async model() {
    return this.store.cache.liveQuery((qb) => qb.findRecords('palette'));
  }
}
