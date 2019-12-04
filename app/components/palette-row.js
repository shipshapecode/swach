import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import ContextMenuMixin from 'ember-context-menu';

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;

  isEditing = false;

  contextItems = [
    {
      icon: 'font',
      label: 'Rename Palette',
      action: this.toggleIsEditing
    },
    {
      icon: 'trash',
      label: 'Delete Palette',
      action: this.deletePalette
    }
  ];

  init() {
    super.init();

    this.dragSort.on('start', ({ draggedItem }) => {
      document.documentElement.style.setProperty(
        '--dragged-swatch-color',
        draggedItem.hex
      );
    });
  }

  @action
  addColorToPalette(color, ops) {
    const palette = ops.target.palette;
    palette.colors.pushObject(color);
    palette.save();
  }

  @action
  deletePalette() {
    this.palette.destroyRecord();
  }

  @action
  enterPress(event) {
    if (event.keyCode === 13) {
      this.nameInput.blur();
    }
  }

  @action
  insertedNameInput(element) {
    this.nameInput = element;
    this.nameInput.focus();
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
