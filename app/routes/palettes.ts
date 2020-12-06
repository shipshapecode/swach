import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import findBy from 'ember-array-utils/utils/find-by';
// import { Store } from 'ember-orbit/addon/index';

export default class PalettesRoute extends Route {
  @service store!: any;
  async model() {
    const palettes = this.store.cache.liveQuery((qb) =>
      qb.findRecords('palette')
    ).value;
    // @ts-ignore TODO: coerce this into an array
    const colorHistory = findBy(palettes, 'isColorHistory', true);

    return {
      colorHistory,
      palettes
    };
  }
}
