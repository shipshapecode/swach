import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model(): Promise<LiveQuery> {
    const palettes = await this.store.cache.liveQuery((qb: any) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: false })
        .sort('index')
    );
    const colorHistory = await this.store.cache.liveQuery((qb: any) =>
      qb
        .findRecords('palette')
        .filter({ attribute: 'isColorHistory', value: true })
    );

    return {
      palettes,
      colorHistory
    };
  }
}
