import Route from '@ember/routing/route';

export default class ColorManagerColorsRoute extends Route {
  queryParams = {
    paletteId: {
      refreshModel: true
    }
  };

  async model({ paletteId }) {
    if (paletteId) {
      const palette = await this.store.findRecord('palette', paletteId);
      return palette.colors;
    }

    return this.store.findAll('color');
  }
}
