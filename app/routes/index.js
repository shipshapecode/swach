import Route from '@ember/routing/route';

export default class IndexRoute extends Route {
  async beforeModel() {
    this.replaceWith('palettes');
  }
}
