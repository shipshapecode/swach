import Controller from '@ember/controller';
import { action } from '@ember/object';
import type ColorModel from 'swach/data-models/color';

export default class KulerController extends Controller {
  queryParams = ['colorId'];

  colorId = null;
  declare model: ColorModel;

  @action
  goBack(): void {
    window.history.back();
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    kuler: KulerController;
  }
}
