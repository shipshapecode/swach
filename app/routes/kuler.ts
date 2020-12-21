import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { Store } from 'ember-orbit';
import ColorModel from 'swach/data-models/color';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
  };

  @service store!: Store;

  async model({ colorId }: { colorId: string }): ColorModel {
    if (colorId) {
      return await this.store.findRecord('color', colorId);
    }
  }
}
