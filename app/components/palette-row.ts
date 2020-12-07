import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';
import { clone } from '@orbit/utils';
import PaletteModel from 'swach/data-models/palette';

interface PaletteRowArgs {
  moveColorsBetweenPalettes: Function;
  palette: PaletteModel;
}

class ContextMenuOption {
  action: Function;
  icon: string;
  label: string;

  @tracked palette: PaletteModel;

  constructor(
    action: Function,
    icon: string,
    label: string,
    palette: PaletteModel
  ) {
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
  action: Function;

  @tracked palette: PaletteModel;

  constructor(action: Function, palette: PaletteModel) {
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
  action: Function;

  @tracked palette: PaletteModel;

  constructor(action: Function, palette: PaletteModel) {
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

export default class PaletteRowComponent extends Component<PaletteRowArgs> {
  @service colorUtils!: any;
  @service contextMenu!: any;
  @service dragSort!: any;
  @service router!: any;
  @service store!: any;
  @service undoManager!: any;

  contextItems:
    | (ContextMenuOption | FavoriteOption | LockOption)[]
    | null = null;
  contextSelection: any;
  contextDetails: any;
  fade = fade;
  isEditing = false;
  nameInput!: HTMLElement;
  showMenu = false;
  @tracked deleteConfirm = false;

  constructor(owner: unknown, args: PaletteRowArgs) {
    super(owner, args);

    this.contextItems = [
      new ContextMenuOption(
        this.toggleIsEditing,
        'rename',
        'Rename Palette',
        this.args.palette
      ),
      new ContextMenuOption(
        this.duplicatePalette,
        'duplicate',
        'Duplicate Palette',
        this.args.palette
      ),
      new ContextMenuOption(
        this.deletePaletteContextMenu,
        'trash',
        'Delete Palette',
        this.args.palette
      ),
      new LockOption(this.lockPalette, this.args.palette),

      new FavoriteOption(this.favoritePalette, this.args.palette)
    ];

    this.dragSort.on(
      'start',
      (event: { draggedItem: { hex: string | null } }) => {
        document.documentElement.style.setProperty(
          '--dragged-swatch-color',
          event.draggedItem.hex
        );
      }
    );
  }

  get isLocked() {
    return this.args.palette.isLocked;
  }

  get sortedColors() {
    return this.args.palette.colorOrder.map(
      (color: { type: string; id: string }) => {
        return this.args.palette.colors.findBy('id', color.id);
      }
    );
  }

  @action
  contextMenuTrigger(e: Event) {
    const items = this.contextItems;
    const selection = this.contextSelection;
    const details = this.contextDetails;

    if (items && items.length) {
      e.preventDefault();
      this.contextMenu.activate(e, items, selection, details);
    }
  }

  @action
  async deletePalette() {
    if (!this.isLocked) {
      if (this.deleteConfirm) {
        await this.store.update((t: any) => t.removeRecord(this.args.palette));
        this.undoManager.setupUndoRedo();
      }

      this.deleteConfirm = true;
    }
  }

  @action
  async deletePaletteContextMenu() {
    if (!this.isLocked) {
      await this.store.update((t: any) => t.removeRecord(this.args.palette));
      this.undoManager.setupUndoRedo();
    }
  }

  @action
  async duplicatePalette() {
    const paletteCopy = clone(this.args.palette.getData());
    delete paletteCopy.id;
    await this.store.update((t: any) => t.addRecord(paletteCopy));

    this.undoManager.setupUndoRedo();
  }

  @action
  enterPress(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      this.nameInput.blur();
    }
  }

  @action
  favoritePalette() {
    if (!this.isLocked) {
      this.args.palette.toggleProperty('isFavorite');
    }
  }

  @action
  insertedNameInput(element: HTMLElement) {
    this.nameInput = element;
    this.nameInput.focus();
  }

  @action
  lockPalette() {
    this.args.palette.toggleProperty('isLocked');
  }

  @action
  toggleIsEditing(): void {
    set(this, 'isEditing', !this.isEditing);
  }

  @action
  transitionToColors(event: Event): void {
    event.stopPropagation();
    this.router.transitionTo('colors', {
      queryParams: { paletteId: this.args.palette.id }
    });
  }

  @action
  updatePaletteName(): void {
    set(this, 'isEditing', false);
  }
}
