import Component from '@ember/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ContextMenuMixin from 'ember-context-menu';
import fade from 'ember-animated/transitions/fade';

class ContextMenuOption {
  @tracked palette;

  constructor(action, icon, label, palette) {
    this.action = action;
    this.icon = icon;
    this.label = label;
    this.palette = palette;
  }

  get disabled() {
    return this.palette.isLocked;
  }
}

class FavoriteOption {
  @tracked palette;

  constructor(action, icon, palette) {
    this.action = action;
    this.icon = icon;
    this.palette = palette;
  }

  get disabled() {
    return this.palette.isLocked;
  }

  get label() {
    const isFavorite = this.palette.isFavorite;
    return isFavorite ? 'Remove from favorites' : 'Add to favorites';
  }
}

class LockOption {
  constructor(action, palette) {
    this.action = action;
    this.palette = palette;
  }

  get icon() {
    const isLocked = this.palette.isLocked;
    return isLocked ? 'unlock' : 'lock';
  }

  get label() {
    const isLocked = this.palette.isLocked;
    return isLocked ? 'Unlock Palette' : 'Lock Palette';
  }
}
export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;
  @service undoManager;

  fade = fade;
  @tracked deleteConfirm = false;
  isEditing = false;
  showMenu = false;

  init() {
    super.init();

    this.contextItems = [
      new ContextMenuOption(
        this.toggleIsEditing,
        'type',
        'Rename Palette',
        this.palette
      ),
      new ContextMenuOption(
        this.duplicatePalette,
        'copy',
        'Duplicate Palette',
        this.palette
      ),
      new ContextMenuOption(
        this.deletePalette,
        'trash',
        'Delete Palette',
        this.palette
      ),
      new LockOption(this.lockPalette, this.palette),

      new FavoriteOption(this.favoritePalette, 'heart', this.palette)
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
    const { palette } = this;
    let paletteCopy = await palette.copy(false);
    await paletteCopy.save();

    this.undoManager.add({
      async undo() {
        await paletteCopy.destroyRecord();
      },
      async redo() {
        paletteCopy = await palette.copy(false);
        await paletteCopy.save();
      }
    });
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
