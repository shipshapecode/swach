import Controller from '@ember/controller';
import { computed } from '@ember/object';

export default class ColorManagerPalettesController extends Controller {
  @computed('model.colors.[]')
  get last15Colors() {
    const colors = this.model.colors || [];
    return colors.sortBy('createdAt').reverse().slice(0, 14);
  }
}
