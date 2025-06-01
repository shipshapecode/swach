import type Owner from '@ember/owner';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import fade from 'ember-animated/transitions/fade';
import type DragSortService from 'ember-drag-sort/services/drag-sort';
import type { Store } from 'ember-orbit';

import type { RecordSchema } from '@orbit/records';
import type { IpcRenderer } from 'electron';

import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type ColorUtils from 'swach/services/color-utils';
import type UndoManager from 'swach/services/undo-manager';

interface PaletteRowSignature {
  Element: HTMLDivElement;
  Args: {
    moveColorsBetweenPalettes: ({
      sourceArgs,
      sourceList,
      sourceIndex,
      targetArgs,
      targetList,
      targetIndex,
    }: {
      sourceArgs: { isColorHistory: boolean; parent: PaletteModel };
      sourceList: ColorModel[];
      sourceIndex: number;
      targetArgs: { isColorHistory: boolean; parent: PaletteModel };
      targetList: ColorModel[];
      targetIndex: number;
    }) => void;
    palette: PaletteModel;
  };
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
    palette: PaletteModel,
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

export default class PaletteRowComponent extends Component<PaletteRowSignature> {
  @service declare colorUtils: ColorUtils;
  @service declare dataSchema: RecordSchema;
  @service declare dragSort: DragSortService;
  @service declare router: Router;
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  declare ipcRenderer: IpcRenderer;

  menuItems: (MenuOption | FavoriteOption | LockOption)[] | null = null;
  fade = fade;
  nameInput!: HTMLElement;
  @tracked isEditing = false;

  constructor(owner: Owner, args: PaletteRowSignature['Args']) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;
    }

    this.menuItems = [
      new MenuOption(
        this.toggleIsEditing,
        'rename',
        'Rename Palette',
        this.args.palette,
      ),
      new MenuOption(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.duplicatePalette,
        'duplicate',
        'Duplicate Palette',
        this.args.palette,
      ),
      new LockOption(this.lockPalette, this.args.palette),
      new FavoriteOption(this.favoritePalette, this.args.palette),
      new MenuOption(
        this.sharePalette,
        'share',
        'Share Palette',
        this.args.palette,
      ),
      new MenuOption(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.deletePalette,
        'trash',
        'Delete Palette',
        this.args.palette,
      ),
    ];

    // @ts-expect-error dragSort.on does not seem to exist in TS
    this.dragSort.on(
      'start',
      (event: { draggedItem: { hex: string | null } }) => {
        document.documentElement.style.setProperty(
          '--dragged-swatch-color',
          event.draggedItem.hex,
        );
      },
    );
  }

  get isLocked() {
    return this.args.palette.isLocked;
  }

  get sortedColors(): (ColorModel | undefined)[] {
    return this.args?.palette?.colorOrder?.map(
      (color: { type: string; id: string }) => {
        return this.args.palette.colors.find((c) => c.id === color.id);
      },
    );
  }

  deletePalette = async () => {
    if (!this.isLocked) {
      await this.store.update((t) => t.removeRecord(this.args.palette));
      this.undoManager.setupUndoRedo();
    }
  };

  duplicatePalette = async () => {
    let colorOrder = this.args.palette.colorOrder;
    const newColors = this.args.palette.colors.map((color) => {
      const colorData = color.$getData();
      const attributes = colorData?.attributes;
      const colorCopy = {
        type: 'color',
        id: this.dataSchema.generateId('color'),
        ...attributes,
        createdAt: new Date(),
      };

      // Find the color by id and replace it with colorCopy.id
      colorOrder = colorOrder.map((c) =>
        c.id === color.id ? { type: 'color', id: colorCopy.id } : c,
      );

      return colorCopy;
    });

    const paletteData = this.args.palette.$getData();
    const attributes = paletteData?.attributes;
    const newPalette = {
      type: 'palette',
      id: this.dataSchema.generateId('palette'),
      ...attributes,
      colors: colorOrder,
      colorOrder,
      createdAt: new Date(),
    };

    await this.store.update((t) => [
      ...newColors.map((c) => t.addRecord(c)),
      t.addRecord(newPalette),
    ]);

    this.undoManager.setupUndoRedo();
  };

  enterPress = (event: KeyboardEvent) => {
    if (event.keyCode === 13) {
      this.nameInput.blur();
    }
  };

  favoritePalette = () => {
    if (!this.isLocked) {
      void this.store.update((t) =>
        t.replaceAttribute(
          this.args.palette,
          'isFavorite',
          !this.args.palette.isFavorite,
        ),
      );
    }
  };

  insertedNameInput = (element: HTMLElement): void => {
    this.nameInput = element;
    this.nameInput.focus();
  };

  lockPalette = () => {
    void this.store.update((t) =>
      t.replaceAttribute(
        this.args.palette,
        'isLocked',
        !this.args.palette.isLocked,
      ),
    );
  };

  sharePalette = () => {
    const { colors, name } = this.args.palette;

    if (colors.length) {
      const urlColors = colors.map((color) => {
        return { hex: color.hex, name: color.name };
      });

      const url = `https://swach.io/palette?data=${encodeURIComponent(
        JSON.stringify({ name, colors: urlColors }),
      )}`;

      if (typeof requireNode !== 'undefined') {
        void this.ipcRenderer.invoke('open-external', url);
      }
    }
  };

  toggleIsEditing = () => {
    this.isEditing = !this.isEditing;
  };

  transitionToColors = (event: Event) => {
    event.stopPropagation();
    this.router.transitionTo('colors', {
      queryParams: { paletteId: this.args.palette.id },
    });
  };

  stopEditing = () => {
    this.isEditing = false;
  };

  updatePaletteName = (e: InputEvent) => {
    void this.store.update((t) =>
      t.replaceAttribute(
        this.args.palette,
        'name',
        (<HTMLInputElement>e.target).value,
      ),
    );
  };
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    PaletteRow: typeof PaletteRowComponent;
  }
}
