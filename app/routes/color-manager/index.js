import Route from '@ember/routing/route';

export default class IndexColorManagerRoute extends Route {
  beforeModel() {
    this.replaceWith('color-manager.palettes');
  }
}
