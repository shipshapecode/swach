import Component from '@glimmer/component';
import { action, set } from '@ember/object';

export default class PaletteRowComponent extends Component {
  isEditing = false;

  @action
  addColorToPalette(color, ops) {
    const palette = ops.target.palette;
    palette.colors.pushObject(color);
    palette.save();
  }

  @action
  insertedNameInput(element) {
    element.focus();
  }

  @action
  toggleIsEditing() {
    set(this, 'isEditing', !this.isEditing);
  }

  @action
  updatePaletteName(palette) {
    palette.save();
    set(this, 'isEditing', false);
  }
}
