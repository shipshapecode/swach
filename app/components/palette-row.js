import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import ContextMenuMixin from 'ember-context-menu';
import fade from 'ember-animated/transitions/fade'

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;

  fade = fade;
  isEditing = false;
  showMenu = false;

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
    },
    {
      icon: 'heart',
      label: 'Favorite Palette',
      action: this.favoritePalette
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
  favoritePalette() {
    this.palette.toggleProperty('isFavorite');
    this.palette.save();
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
