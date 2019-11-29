import Controller from '@ember/controller';
import { action, computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ColorManagerPalettesController extends Controller {
  @service store;

  @computed('model.colors.[]')
  get last15Colors() {
    const colors = this.model.colors || [];
    return colors
      .sortBy('createdAt')
      .reverse()
      .slice(0, 14);
  }

  @computed('model.palettes.[]')
  get palettes() {
    const palettes = this.model.palettes || [];
    return palettes.sortBy('createdAt').reverse();
  }

  @action
  createNewPalette() {
    this.store.createRecord('palette', { name: 'Palette' });
  }
}
