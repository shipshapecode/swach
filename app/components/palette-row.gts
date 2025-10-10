import { concat, fn, hash } from '@ember/helper';
import { on } from '@ember/modifier';
import type Owner from '@ember/owner';
import didInsert from '@ember/render-modifiers/modifiers/did-insert';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import noop from '@nullvoxpopuli/ember-composable-helpers/helpers/noop';
import fade from 'ember-animated/transitions/fade';
import DragSortList from 'ember-drag-sort/components/drag-sort-list';
import type DragSortService from 'ember-drag-sort/services/drag-sort';
import stopPropagation from 'ember-event-helpers/helpers/stop-propagation';
import sub from 'ember-math-helpers/helpers/sub';
import { orbit, type Store } from 'ember-orbit';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import eq from 'ember-truth-helpers/helpers/eq';
import not from 'ember-truth-helpers/helpers/not';
import type { RecordSchema } from '@orbit/records';
import type { IpcRenderer } from 'electron';
import htmlSafe from '../helpers/html-safe.ts';
import OptionsMenu from './options-menu.gts';
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

  get disabled() {
    return false;
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
  <template>
    {{! template-lint-disable no-nested-interactive }}
    <div
      class="bg-menu cursor-default mb-2 overflow-visible p-3 rounded-sm w-full"
      data-test-palette-row="{{@palette.name}}"
      role="button"
      {{on "click" this.transitionToColors}}
    >
      <div
        class="flex items-center justify-between overflow-visible pb-2 w-full"
      >
        <h6 class="text-sm">
          {{#if this.isEditing}}
            <input
              data-test-palette-name-input
              class="input h-6"
              value={{@palette.name}}
              type="text"
              {{didInsert this.insertedNameInput}}
              {{on "click" (stopPropagation (noop))}}
              {{on "blur-sm" this.stopEditing}}
              {{on "keypress" this.enterPress}}
              {{on "input" this.updatePaletteName}}
            />
          {{else}}
            <div
              data-test-palette-name
              class="flex grow h-6 items-center text-main-text w-full"
            >
              {{#if @palette.isLocked}}
                {{svgJar "lock" class="icon mr-1" height="12" width="12"}}
              {{/if}}
              {{@palette.name}}
            </div>
          {{/if}}
        </h6>

        <OptionsMenu
          data-test-palette-row-menu
          class="text-sm"
          @showBackground={{true}}
        >
          <:trigger>
            {{svgJar "more-horizontal" class="icon" height="15" width="15"}}
          </:trigger>
          <:content>
            {{#each this.menuItems as |item|}}
              <button
                data-test-menu-item={{item.label}}
                class="flex items-center p-1 text-menu-text transition-colors whitespace-nowrap disabled:opacity-50
                  {{if (not item.disabled) 'hover:text-menu-text-hover'}}"
                disabled={{item.disabled}}
                type="button"
                {{on "click" item.action}}
              >
                {{svgJar item.icon class="icon mr-4" height="15" width="15"}}
                {{item.label}}
              </button>
            {{/each}}
          </:content>
        </OptionsMenu>
      </div>

      <div class="palette flex grow h-8 relative w-full">
        {{#unless @palette.colors.length}}
          <div
            class="absolute bg-main border border-dashed border-gray-400 flex grow h-8 items-center justify-center rounded-sm text-sm top-0 w-full"
          >
            Drag colors here
          </div>
        {{/unless}}

        <DragSortList
          class="absolute palette-color-squares flex grow h-8 top-0 w-full
            {{if this.isLocked 'palette-locked'}}"
          @additionalArgs={{hash parent=@palette}}
          @childClass="flex grow"
          @group={{if @palette.isLocked @palette.id undefined}}
          @isHorizontal={{true}}
          @items={{this.sortedColors}}
          @sourceOnly={{@palette.isLocked}}
          @dragEndAction={{@moveColorsBetweenPalettes}}
          as |color index|
        >
          <div
            class="flex grow relative
              {{if (eq index 0) 'rounded-l'}}
              {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}"
          >
            <div
              data-test-palette-color-square={{color.name}}
              class="absolute h-full left-0 top-0 w-full z-10
                {{if (eq index 0) 'rounded-l'}}
                {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}"
              style={{htmlSafe (concat "background-color: " color.hex)}}
              {{on
                "click"
                (stopPropagation
                  (fn this.colorUtils.copyColorToClipboard color)
                )
              }}
            ></div>
            <div
              class="opacity-checkerboard absolute h-full left-0 top-0 w-full z-0
                {{if (eq index 0) 'rounded-l'}}
                {{if (eq index (sub @palette.colors.length 1)) 'rounded-r'}}"
            ></div>
          </div>
        </DragSortList>
      </div>
    </div>
  </template>

  @orbit declare dataSchema: RecordSchema;
  @orbit declare store: Store;

  @service declare colorUtils: ColorUtils;
  @service declare dragSort: DragSortService<ColorModel>;
  @service declare router: Router;
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
        this.args.palette
      ),
      new MenuOption(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.deletePalette,
        'trash',
        'Delete Palette',
        this.args.palette
      ),
    ];

    this.dragSort.on('start', (event: CustomEvent) => {
      const draggedItem = event.detail?.draggedItem as
        | { hex: string | null }
        | undefined;
      if (draggedItem) {
        document.documentElement.style.setProperty(
          '--dragged-swatch-color',
          draggedItem.hex
        );
      }
    });
  }

  get isLocked() {
    return this.args.palette.isLocked;
  }

  get sortedColors(): Array<ColorModel> {
    return this.args.palette.colorOrder.map(
      (color: { type: string; id: string }) => {
        return this.args.palette.colors.find((c) => c.id === color.id);
      }
    ) as Array<ColorModel>;
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
        c.id === color.id ? { type: 'color', id: colorCopy.id } : c
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
          !this.args.palette.isFavorite
        )
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
        !this.args.palette.isLocked
      )
    );
  };

  sharePalette = () => {
    const { colors, name } = this.args.palette;

    if (colors.length) {
      const urlColors = colors.map((color) => {
        return { hex: color.hex, name: color.name };
      });

      const url = `https://swach.io/palette?data=${encodeURIComponent(
        JSON.stringify({ name, colors: urlColors })
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

  updatePaletteName = (event: Event) => {
    void this.store.update((t) =>
      t.replaceAttribute(
        this.args.palette,
        'name',
        (<HTMLInputElement>event.target).value
      )
    );
  };
}
