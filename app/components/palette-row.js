import Component from '@ember/component';
import EmberObject, { action, computed, set } from '@ember/object';
import { inject as service } from '@ember/service';
import ContextMenuMixin from 'ember-context-menu';
import fade from 'ember-animated/transitions/fade';

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
      icon: 'type',
      label: 'Rename Palette',
      action: this.toggleIsEditing
    },
    {
      icon: 'copy',
      label: 'Duplicate Palette',
      action: this.duplicatePalette
    },
    {
      icon: 'trash',
      label: 'Delete Palette',
      action: this.deletePalette
    }
  ];

  init() {
    super.init();

    this.contextItems.pushObject(
      EmberObject.extend({
        palette: this.palette,
        icon: 'heart',
        label: computed('palette.isFavorite', function() {
          const isFavorite = this.palette.isFavorite;
          return isFavorite ? 'Remove from favorites' : 'Add to favorites';
        }),
        action: this.favoritePalette
      }).create()
    );

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
  async duplicatePalette() {
    const paletteCopy = await this.palette.copy(false);
    await paletteCopy.save();
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
  lockPalette() {
    this.palette.toggleProperty('isLocked');
    this.palette.save();
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
