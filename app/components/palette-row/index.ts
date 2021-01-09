import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import fade from 'ember-animated/transitions/fade';
import ContextMenuService from 'ember-context-menu/services/context-menu';
import DragSortService from 'ember-drag-sort/services/drag-sort';
import { Store } from 'ember-orbit';

import { clone } from '@orbit/utils';

import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import ColorUtils from 'swach/services/color-utils';
import UndoManager from 'swach/services/undo-manager';

interface PaletteRowArgs {
  moveColorsBetweenPalettes: ({
    sourceArgs,
    sourceList,
    sourceIndex,
    targetArgs,
    targetList,
    targetIndex
  }: {
    sourceArgs: { isColorHistory: boolean; parent: PaletteModel };
    sourceList: ColorModel[];
    sourceIndex: number;
    targetArgs: { isColorHistory: boolean; parent: PaletteModel };
    targetList: ColorModel[];
    targetIndex: number;
  }) => void;
  palette: PaletteModel;
}

class ContextMenuOption {
  action: () => void;
  icon: string;
  label: string;

  @tracked palette: PaletteModel;

  constructor(
    action: () => void,
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
  action: () => void;

  @tracked palette: PaletteModel;

  constructor(action: () => void, palette: PaletteModel) {
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
  action: () => void;

  @tracked palette: PaletteModel;

  constructor(action: () => void, palette: PaletteModel) {
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
  @service colorUtils!: ColorUtils;
  @service contextMenu!: ContextMenuService;
  @service dragSort!: DragSortService;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  contextItems:
    | (ContextMenuOption | FavoriteOption | LockOption)[]
    | null = null;
  contextSelection: any;
  contextDetails: any;
  fade = fade;
  nameInput!: HTMLElement;
  showMenu = false;
  @tracked deleteConfirm = false;
  @tracked isEditing = false;

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

  get isLocked(): boolean {
    return this.args.palette.isLocked;
  }

  get sortedColors(): (ColorModel | undefined)[] {
    return this.args.palette.colorOrder.map(
      (color: { type: string; id: string }) => {
        return this.args.palette.colors.findBy('id', color.id);
      }
    );
  }

  @action
  contextMenuTrigger(e: Event): void {
    const items = this.contextItems;
    const selection = this.contextSelection;
    const details = this.contextDetails;

    if (items && items.length) {
      e.preventDefault();
      this.contextMenu.activate(e, items, selection, details);
    }
  }

  @action
  async deletePalette(): Promise<void> {
    if (!this.isLocked) {
      if (this.deleteConfirm) {
        await this.store.update((t: Store['transformBuilder']) =>
          t.removeRecord(this.args.palette)
        );
        this.undoManager.setupUndoRedo();
      }

      this.deleteConfirm = true;
    }
  }

  @action
  async deletePaletteContextMenu(): Promise<void> {
    if (!this.isLocked) {
      await this.store.update((t: Store['transformBuilder']) =>
        t.removeRecord(this.args.palette)
      );
      this.undoManager.setupUndoRedo();
    }
  }

  @action
  async duplicatePalette(): Promise<void> {
    const paletteCopy = clone(this.args.palette.getData());
    delete paletteCopy.id;
    await this.store.update((t: Store['transformBuilder']) =>
      t.addRecord(paletteCopy)
    );

    this.undoManager.setupUndoRedo();
  }

  @action
  enterPress(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      this.nameInput.blur();
    }
  }

  @action
  favoritePalette(): void {
    if (!this.isLocked) {
      this.args.palette.replaceAttribute(
        'isFavorite',
        !this.args.palette.isFavorite
      );
    }
  }

  @action
  insertedNameInput(element: HTMLElement): void {
    this.nameInput = element;
    this.nameInput.focus();
  }

  @action
  lockPalette(): void {
    this.args.palette.replaceAttribute('isLocked', !this.args.palette.isLocked);
  }

  @action
  toggleIsEditing(): void {
    this.isEditing = !this.isEditing;
  }

  @action
  transitionToColors(event: Event): void {
    event.stopPropagation();
    this.router.transitionTo('colors', {
      queryParams: { paletteId: this.args.palette.id }
    });
  }

  @action
  stopEditing(): void {
    this.isEditing = false;
  }

  @action
  updatePaletteName(e: InputEvent): void {
    this.args.palette.replaceAttribute(
      'name',
      (<HTMLInputElement>e.target).value
    );
  }
}
