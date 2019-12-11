import Controller from '@ember/controller';

export default class ColorsController extends Controller {
  queryParams = ['paletteId'];

  paletteId = null;
}
