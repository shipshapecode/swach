import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import ContextMenuMixin from 'ember-context-menu';

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;

  isEditing = false;

  contextItems = [
    {
      label: 'Rename Palette',
      action: this.toggleIsEditing
    }
  ];

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
    const palette = this.palette;
    set(palette, 'colors', A(colors));
    palette.save();
  }

  @action
  updatePaletteName(palette) {
    palette.save();
    set(this, 'isEditing', false);
  }
}
