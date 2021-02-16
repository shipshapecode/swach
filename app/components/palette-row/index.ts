import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import fade from 'ember-animated/transitions/fade';
import DragSortService from 'ember-drag-sort/services/drag-sort';
import { Store } from 'ember-orbit';

import { RecordOperationTerm } from '@orbit/records';
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

class MenuOption {
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
    return isFavorite ? 'slash-heart' : 'filled-heart';
  }

  get label() {
    const isFavorite = this.palette.isFavorite;
    return isFavorite ? 'Unfavorite' : 'Favorite';
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
  @service dataSchema!: any;
  @service dragSort!: DragSortService;
  @service router!: Router;
  @service store!: Store;
  @service undoManager!: UndoManager;

  menuItems: (MenuOption | FavoriteOption | LockOption)[] | null = null;
  fade = fade;
  nameInput!: HTMLElement;
  @tracked isEditing = false;

  constructor(owner: unknown, args: PaletteRowArgs) {
    super(owner, args);

    this.menuItems = [
      new MenuOption(
        this.toggleIsEditing,
        'rename',
        'Rename Palette',
        this.args.palette
      ),
      new MenuOption(
        this.duplicatePalette,
        'duplicate',
        'Duplicate Palette',
        this.args.palette
      ),
      new LockOption(this.lockPalette, this.args.palette),
      new FavoriteOption(this.favoritePalette, this.args.palette),
      new MenuOption(
        this.sharePalette,
        'share',
        'Share Palette',
        this.args.palette
      ),
      new MenuOption(
        this.deletePalette,
        'trash',
        'Delete Palette',
        this.args.palette
      )
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
    return this.args?.palette?.colorOrder?.map(
      (color: { type: string; id: string }) => {
        return this.args.palette.colors.findBy('id', color.id);
      }
    );
  }

  @action
  async deletePalette(): Promise<void> {
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
    paletteCopy.id = this.dataSchema.generateId('palette');
    delete paletteCopy.attributes.colorOrder;
    delete paletteCopy.relationships;
    await this.store.update((t: Store['transformBuilder']) => {
      let colorOrder = this.args.palette.colorOrder;
      const addPaletteOperation = t.addRecord(paletteCopy);

      const operations: RecordOperationTerm[] = [addPaletteOperation];

      this.args.palette.colors.forEach((color) => {
        const colorCopy = clone(color.getData());
        colorCopy.id = this.dataSchema.generateId('color');
        delete colorCopy.relationships;
        const addColorOperation = t.addRecord(colorCopy);

        // Find the color by id and replace it with colorCopy.id
        colorOrder = colorOrder.map((c) =>
          c.id === color.id ? { type: 'color', id: colorCopy.id } : c
        );

        operations.push(addColorOperation);
        operations.push(
          t.replaceRelatedRecord(
            { type: 'color', id: colorCopy.id },
            'palette',
            { type: 'palette', id: paletteCopy.id }
          )
        );
      });

      operations.push(
        t.replaceAttribute(
          { type: 'palette', id: paletteCopy.id },
          'colorOrder',
          colorOrder
        )
      );

      return operations;
    });

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
  sharePalette(): void {
    const { colors, name } = this.args.palette;
    if (colors.length) {
      const urlColors = colors.map((color) => {
        return { hex: color.hex, name: color.name };
      });

      const url = `https://swach.io/palette?data=${encodeURIComponent(
        JSON.stringify({ name, colors: urlColors })
      )}`;

      if (typeof requireNode !== 'undefined') {
        requireNode('electron').shell.openExternal(url);
      }
    }
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
