import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Owner from '@ember/owner';
import { service } from '@ember/service';
import { capitalize } from '@ember/string';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type { Store } from '@ef4/ember-orbit';
import eq from 'ember-truth-helpers/helpers/eq';
import isEmpty from 'ember-truth-helpers/helpers/is-empty';
import not from 'ember-truth-helpers/helpers/not';
import notEq from 'ember-truth-helpers/helpers/not-eq';
import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';
import type { IpcRenderer } from 'electron';
import { debounce } from 'throttle-debounce';
import capitalize0 from '../helpers/capitalize.ts';
import EditSelectedColor from './edit-selected-color.gts';
import KulerPaletteRow from './kuler-palette-row.gts';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type { ColorPOJO } from 'swach/services/color-utils';
import type ColorUtils from 'swach/services/color-utils';

/* eslint-disable @typescript-eslint/unbound-method */

type harmonyTypes = 'analogous' | 'monochromatic' | 'tetrad' | 'triad';

class Palette {
  @tracked colors: ColorModel[] = [];
  @tracked selectedColorIndex = 0;

  createdAt: Date;
  isColorHistory = false;
  isFavorite = false;
  isLocked = false;
  name: string;
  type = 'palette';

  constructor(harmony: harmonyTypes) {
    this.type = 'palette';
    this.name = capitalize(harmony);
    this.createdAt = new Date();
  }
}

interface KulerSignature {
  Element: HTMLDivElement;
  Args: {
    baseColor: ColorModel;
  };
}

export default class KulerComponent extends Component<KulerSignature> {
  <template>
    <div class="bg-menu p-4 pb-8 rounded">
      <div class="mb-4">
        <select
          data-test-kuler-select
          class="input"
          id="harmony"
          {{on "change" this.setSelectedPalette}}
        >
          {{#each this.palettes as |palette|}}
            <option
              data-test-kuler-select-harmony="{{capitalize0 palette.name}}"
              class="capitalize"
              value={{palette.name}}
              selected={{eq this.selectedPalette palette}}
            >
              {{palette.name}}
            </option>
          {{/each}}
        </select>
      </div>

      <div class="flex justify-center pt-2 w-full">
        <div
          class="kuler-color-picker-container w-auto"
          id="kuler-color-picker-container"
        ></div>
      </div>
    </div>

    <h2 class="mb-2 ml-1 mt-4 text-lg text-heading">
      Palette
    </h2>

    {{#if (not (isEmpty this.selectedPalette.selectedColorIndex))}}
      <div class="bg-menu p-4 rounded">
        <KulerPaletteRow
          @palette={{this.selectedPalette}}
          @setSelectedIroColor={{this.setSelectedIroColor}}
        />

        <EditSelectedColor
          @colorPicker={{this.colorPicker}}
          @palette={{this.selectedPalette}}
        />

        {{#if (notEq this.selectedPalette.selectedColorIndex 0)}}
          <button
            data-test-set-base-color
            class="btn btn-primary grow mt-5 p-2 text-sm w-full"
            type="button"
            {{on "click" this.setColorAsBase}}
          >
            🏠 Set as base
          </button>
        {{/if}}
      </div>
    {{/if}}
  </template>
  @service declare colorUtils: ColorUtils;
  @service declare store: Store;

  _debouncedColorChange!: (color: iro.Color | string) => void;
  colorPicker!: iro.ColorPicker;
  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'] as const;
  declare ipcRenderer: IpcRenderer;

  @tracked baseColor;
  @tracked colors = [];
  @tracked palettes: PaletteModel[] = [];
  @tracked selectedPalette!: PaletteModel;

  constructor(owner: Owner, args: KulerSignature['Args']) {
    super(owner, args);

    this._debouncedColorChange = debounce(10, this._onColorChange);

    this.baseColor = this.args.baseColor;
    void this.baseColorChanged().then(() => {
      this._setupColorWheel();

      if (typeof requireNode !== 'undefined') {
        const { ipcRenderer } = requireNode('electron');

        this.ipcRenderer = ipcRenderer;

        this.ipcRenderer.on(
          'selectKulerColor',
          (_event: unknown, colorIndex: number) => {
            this.setSelectedIroColor(colorIndex);
          },
        );

        this.ipcRenderer.on(
          'updateKulerColor',
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          async (_event: unknown, color: string | iro.Color) => {
            await this._onColorChange(color);
            this.colorPicker.setColors(
              this.selectedPalette.colors.map((c) => c.hex),
              this.selectedPalette.selectedColorIndex,
            );
          },
        );
      }
    });
  }

  willDestroy(): void {
    super.willDestroy();

    this._destroyLeftoverPalettes();
    this.colorPicker.off('color:change', this._debouncedColorChange);
    this.colorPicker.off('color:setActive', this._onColorSetActive);

    if (this.ipcRenderer) {
      this.ipcRenderer.removeAllListeners('selectKulerColor');
      this.ipcRenderer.removeAllListeners('updateKulerColor');
    }
  }

  @action
  // eslint-disable-next-line @typescript-eslint/require-await
  async baseColorChanged(selectedPaletteTypeIndex = 0): Promise<void> {
    this._destroyLeftoverPalettes();

    const palettes: PaletteModel[] = [];

    for (const harmony of this.harmonies) {
      const palette = new Palette(harmony as harmonyTypes);
      const tinyColors = new TinyColor(this.baseColor.hex)[harmony](5);
      const colorPOJOs = tinyColors.map((color: TinyColor) => {
        return this.colorUtils.createColorPOJO(color.toHexString());
      });
      const colors = colorPOJOs.map(
        (color: ColorPOJO) => color.attributes,
      ) as unknown as ColorModel[];

      palette.colors = colors;
      palettes.push(palette as unknown as PaletteModel);
    }

    this.palettes = palettes;

    this.selectedPalette = this.palettes[
      selectedPaletteTypeIndex
    ];
  }

  @action
  setColorAsBase(): Promise<void> {
    this.baseColor = this.selectedPalette.colors[
      this.selectedPalette.selectedColorIndex
    ];

    return this.baseColorChanged(
      this.palettes.indexOf(this.selectedPalette),
    ).then(() => {
      this.colorPicker.setColors(
        this.selectedPalette.colors.map((c) => c.hex),
        this.selectedPalette.selectedColorIndex,
      );
    });
  }

  /**
   * Sets the selected color in the iro.js color wheel
   * @param index The index of the color to make active
   */
  @action
  setSelectedIroColor(index: number): void {
    this.colorPicker.setActiveColor(index);
  }

  /**
   * Sets the selected palette and the colors for the color picker
   */
  @action
  setSelectedPalette(event: Event): void {
    const paletteName = (<HTMLInputElement>event.target).value;
    const palette = this.palettes.find((p) => p.name === paletteName);

    if (palette) {
      this.selectedPalette = palette;
      this.colorPicker.setColors(
        this.selectedPalette.colors.map((c) => c.hex),
        palette.selectedColorIndex,
      );
    }
  }

  @action
  _destroyLeftoverPalettes(): void {
    this.palettes = [];
  }

  @action
  async _onColorChange(color: iro.Color | string): Promise<void> {
    const { selectedColorIndex } = this.selectedPalette;
    // if changing the selected baseColor, we should update all the colors
    const newColor = this.colorUtils.createColorPOJO(
      color instanceof iro.Color ? color.rgba : color,
    );

    // @ts-expect-error TODO: fix this to be able to not use prototype extensions
    this.selectedPalette.colors.replace(selectedColorIndex, 1, [
      newColor.attributes,
    ]);

    if (selectedColorIndex === 0) {
      this.baseColor = this.selectedPalette.colors[
        this.selectedPalette.selectedColorIndex
      ];
      await this.setColorAsBase();
    }

    this.colorPicker.setColors(
      this.selectedPalette.colors.map((c) => c.hex),
      this.selectedPalette.selectedColorIndex,
    );
  }

  @action
  _onColorSetActive(color: iro.Color): void {
    if (color) {
      this.selectedPalette.selectedColorIndex = color.index;
    }
  }

  @action
  _setupColorWheel(): void {
    // TODO: correctly type this instead of using `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.colorPicker = (iro.ColorPicker as any)(
      '#kuler-color-picker-container',
      {
        colors: this.selectedPalette.colors.map((c) => c.hex),
        layoutDirection: 'horizontal',
        layout: [
          {
            component: iro.ui.Slider,
            options: {
              borderColor: 'transparent',
              borderWidth: 0,
              sliderSize: 10,
              sliderType: 'alpha',
              width: 250,
            },
          },
          {
            component: iro.ui.Slider,
            options: {
              borderColor: 'transparent',
              borderWidth: 0,
              margin: 25,
              sliderSize: 10,
              sliderType: 'value',
              width: 250,
            },
          },
          {
            component: iro.ui.Wheel,
            options: {
              borderColor: 'transparent',
              borderWidth: 0,
              margin: 30,
              width: 225,
            },
          },
        ],
        width: 207,
      },
    );

    this.colorPicker.on('color:change', this._debouncedColorChange);
    this.colorPicker.on('color:setActive', this._onColorSetActive);
  }
}
