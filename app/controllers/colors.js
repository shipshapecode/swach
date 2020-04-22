import Controller, { inject as controller } from '@ember/controller';

export default class ColorsController extends Controller {
  queryParams = ['paletteId'];

  @controller application;

  paletteId = null;
}
