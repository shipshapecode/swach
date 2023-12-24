import Controller, { inject as controller } from '@ember/controller';

import type ApplicationController from 'swach/controllers/application';
import type PaletteModel from 'swach/data-models/palette';

export default class ColorsController extends Controller {
  queryParams = ['paletteId'];

  @controller application!: ApplicationController;

  declare model: PaletteModel;

  paletteId = null;
}

// DO NOT DELETE: this is how TypeScript knows how to look up your controllers.
declare module '@ember/controller' {
  interface Registry {
    colors: ColorsController;
  }
}
