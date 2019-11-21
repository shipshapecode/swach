import Route from '@ember/routing/route';

export default class ColorManagerColorsRoute extends Route {
  model() {
    return this.store.findAll('color');
  }
}
