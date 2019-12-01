import Route from '@ember/routing/route';

export default class ColorManagerColorsRoute extends Route {
  queryParams = {
    paletteId: {
      refreshModel: true
    }
  };

  model({ paletteId }) {
    if (paletteId) {
      return this.store.findRecord('palette', paletteId);
    }
  }
}
