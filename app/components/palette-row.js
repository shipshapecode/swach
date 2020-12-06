/* eslint-disable ember/no-classic-components, ember/no-computed-properties-in-native-classes, ember/require-tagless-components  */
import Component from '@ember/component';
import { action, computed, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ContextMenuMixin from 'ember-context-menu';
import fade from 'ember-animated/transitions/fade';
import { clone } from '@orbit/utils';
import classic from 'ember-classic-decorator';
import findBy from 'ember-array-utils/utils/find-by';

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

  constructor(action, palette) {
    this.action = action;
    this.palette = palette;
  }

  get disabled() {
    return this.palette.isLocked;
  }

  get icon() {
    const isFavorite = this.palette.isFavorite;
    return isFavorite ? 'filled-heart' : 'outline-heart';
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

@classic
export default class PaletteRowComponent extends Component.extend(
  ContextMenuMixin
) {
  @service colorUtils;
  @service dragSort;
  @service router;
  @service store;
  @service undoManager;

  fade = fade;
  @tracked deleteConfirm = false;
  isEditing = false;
  showMenu = false;

  @computed('palette.{colors.[],colorOrder.[]}')
  get sortedColors() {
    return this.palette.colorOrder.map((color) => {
      return findBy(this.palette.colors, 'id', color.id);
    });
  }

  init() {
    super.init();

    this.contextItems = [
      new ContextMenuOption(
        this.toggleIsEditing,
        'rename',
        'Rename Palette',
        this.palette
      ),
      new ContextMenuOption(
        this.duplicatePalette,
        'duplicate',
        'Duplicate Palette',
        this.palette
      ),
      new ContextMenuOption(
        this.deletePaletteContextMenu,
        'trash',
        'Delete Palette',
        this.palette
      ),
      new LockOption(this.lockPalette, this.palette),

      new FavoriteOption(this.favoritePalette, this.palette)
    ];

    this.dragSort.on('start', ({ draggedItem }) => {
      document.documentElement.style.setProperty(
        '--dragged-swatch-color',
        draggedItem.hex
      );
    });
  }

  @action
  async deletePalette() {
    if (!this.palette.isLocked) {
      if (this.deleteConfirm) {
        await this.store.update((t) => t.removeRecord(this.palette));
        this.undoManager.setupUndoRedo();
      }

      this.deleteConfirm = true;
    }
  }

  @action
  async deletePaletteContextMenu() {
    if (!this.palette.isLocked) {
      await this.store.update((t) => t.removeRecord(this.palette));
      this.undoManager.setupUndoRedo();
    }
  }

  @action
  async duplicatePalette() {
    const paletteCopy = clone(this.palette.getData());
    delete paletteCopy.id;
    await this.store.update((t) => t.addRecord(paletteCopy));

    this.undoManager.setupUndoRedo();
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
  }

  @action
  toggleIsEditing() {
    set(this, 'isEditing', !this.isEditing);
  }

  @action
  transitionToColors(event) {
    event.stopPropagation();
    this.router.transitionTo('colors', {
      queryParams: { paletteId: this.palette.id }
    });
  }

  @action
  updatePaletteName() {
    set(this, 'isEditing', false);
  }
}
