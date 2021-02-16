import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

import { LiveQuery, Store } from 'ember-orbit';

import { RecordQueryBuilder } from '@orbit/records';

export default class PalettesRoute extends Route {
  @service store!: Store;

  async model(): Promise<{ palettes: LiveQuery; colorHistory: LiveQuery }> {
    const palettes = await this.store.cache.liveQuery(
      (qb: RecordQueryBuilder) =>
        qb
          .findRecords('palette')
          .filter({ attribute: 'isColorHistory', value: false })
          .sort('index')
    );
    const colorHistory = await this.store.cache.liveQuery(
      (qb: RecordQueryBuilder) =>
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
