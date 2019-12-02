import Controller from '@ember/controller';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ColorManagerPalettesController extends Controller {
  @service store;

  @computed('model.colorHistory.colors.[]')
  get last15Colors() {
    const colors = this.model.colorHistory.colors || [];
    return colors
      .sortBy('createdAt')
      .reverse()
      .slice(0, 14);
  }

  @computed('model.palettes.[]')
  get palettes() {
    const palettes = this.model.palettes || [];
    return palettes.filterBy('isColorHistory', false).sortBy('createdAt').reverse();
  }

  @action
  createNewPalette() {
    this.store.createRecord('palette', { name: 'Palette' });
  }
}
