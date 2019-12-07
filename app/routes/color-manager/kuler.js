import Route from '@ember/routing/route';

export default class ColorManagerKulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
  };

  async model({ colorId }) {
    if (colorId) {
      return this.store.findRecord('color', colorId);
    }
  }
}
