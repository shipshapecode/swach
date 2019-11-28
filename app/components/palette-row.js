import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';

export default class PaletteRowComponent extends Component {
  @service colorUtils;
  
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
  updateColorOrder(colors) {
    const palette = this.args.palette;
    set(palette, 'colors', A(colors));
    palette.save();
  }

  @action
  updatePaletteName(palette) {
    palette.save();
    set(this, 'isEditing', false);
  }
}
