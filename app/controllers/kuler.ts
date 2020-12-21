import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class KulerController extends Controller {
  queryParams = ['colorId'];

  colorId = null;

  @action
  goBack() {
    window.history.back();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    'kuler': KulerController;
  }
}
