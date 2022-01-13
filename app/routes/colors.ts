import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { Store } from 'ember-orbit';

import PaletteModel from 'swach/data-models/palette';

export default class ColorsRoute extends Route {
  queryParams = {
    paletteId: {
      refreshModel: true
    }
  };

  @service store!: Store;

  async model({
    paletteId
  }: {
    paletteId: string;
  }): Promise<PaletteModel | undefined> {
    if (paletteId) {
      const palette = await this.store.findRecord('palette', paletteId);
      return <PaletteModel>palette;
    }
  }
}
