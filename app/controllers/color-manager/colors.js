import Controller from '@ember/controller';

export default class ColorManagerColorsController extends Controller {
  queryParams = ['paletteId'];

  paletteId = null;
}
