import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { Model, Store } from 'ember-orbit';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
  };

  @service store!: Store;

  async model({ colorId }: { colorId: string }): Promise<Model | undefined> {
    if (colorId) {
      return await this.store.findRecord('color', colorId);
    }
  }
}
