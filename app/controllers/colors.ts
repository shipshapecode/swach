import Controller, { inject as controller } from '@ember/controller';
import ApplicationController from 'swach/controllers/application';

export default class ColorsController extends Controller {
  queryParams = ['paletteId'];

  @controller application!: ApplicationController;

  paletteId = null;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    colors: ColorsController;
  }
}
