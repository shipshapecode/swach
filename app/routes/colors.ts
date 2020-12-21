import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { Store } from 'ember-orbit';

export default class ColorsRoute extends Route {
  queryParams = {
    paletteId: {
      refreshModel: true
    }
  };

  @service store!: Store;

  async model({ paletteId }: { paletteId: string }) {
    if (paletteId) {
      return await this.store.findRecord('palette', paletteId);
    }
  }
}
