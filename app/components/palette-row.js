import Component from '@ember/component';
import EmberObject, { action, computed, set } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ContextMenuMixin from 'ember-context-menu';
import fade from 'ember-animated/transitions/fade';

export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;

  fade = fade;
  @tracked deleteConfirm = false;
  isEditing = false;
  showMenu = false;

  init() {
    super.init();

    this.contextItems = [
      EmberObject.extend({
        palette: this.palette,
        icon: 'type',
        label: 'Rename Palette',
        disabled: readOnly('palette.isLocked'),
        action: this.toggleIsEditing
      }).create(),
      EmberObject.extend({
        palette: this.palette,
        icon: 'copy',
        label: 'Duplicate Palette',
        disabled: readOnly('palette.isLocked'),
        action: this.duplicatePalette
      }).create(),
      EmberObject.extend({
        palette: this.palette,
        icon: 'trash',
        label: 'Delete Palette',
        disabled: readOnly('palette.isLocked'),
        action: this.deletePalette
      }).create(),
      EmberObject.extend({
        palette: this.palette,
        icon: computed('palette.isLocked', function() {
          const isLocked = this.palette.isLocked;
          return isLocked ? 'unlock' : 'lock';
        }),
        label: computed('palette.isLocked', function() {
          const isLocked = this.palette.isLocked;
          return isLocked ? 'Unlock Palette' : 'Lock Palette';
        }),
        action: this.lockPalette
      }).create(),

      EmberObject.extend({
        palette: this.palette,
        icon: 'heart',
        disabled: readOnly('palette.isLocked'),
        label: computed('palette.isFavorite', function() {
          const isFavorite = this.palette.isFavorite;
          return isFavorite ? 'Remove from favorites' : 'Add to favorites';
        }),
        action: this.favoritePalette
      }).create()
    ];

    this.dragSort.on('start', ({ draggedItem }) => {
      document.documentElement.style.setProperty(
        '--dragged-swatch-color',
        draggedItem.hex
      );
    });
  }

  @action
  deletePalette() {
    if (!this.palette.isLocked) {
      if (this.deleteConfirm) {
        this.palette.destroyRecord();
      }

      this.deleteConfirm = true;
    }
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
    if (!this.palette.isLocked) {
      this.palette.toggleProperty('isFavorite');
      this.palette.save();
    }
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
