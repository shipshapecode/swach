import Route from '@ember/routing/route';

export default class KulerRoute extends Route {
  queryParams = {
    colorId: {
      refreshModel: true
    }
  };

  async model({ colorId }) {
    if (colorId) {
      return await this.store.findRecord('color', colorId);
    }
  }
}
