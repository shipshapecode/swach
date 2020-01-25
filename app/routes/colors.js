import Route from '@ember/routing/route';

export default class ColorsRoute extends Route {
  queryParams = {
    paletteId: {
      refreshModel: true
    }
  };

  async model({ paletteId }) {
    if (paletteId) {
      return await this.store.findRecord('palette', paletteId);
    }
  }
}
