import { action } from '@ember/object';
import { service } from '@ember/service';
import { capitalize } from '@ember/string';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type { Store } from 'ember-orbit';

import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';
import type { IpcRenderer } from 'electron';
import { debounce } from 'throttle-debounce';

import 'swach/components/kuler-palette-row';
import type { ColorPOJO } from 'swach/services/color-utils';
import type ColorUtils from 'swach/services/color-utils';

type harmonyTypes = 'analogous' | 'monochromatic' | 'tetrad' | 'triad';

class Palette {
  @tracked colors = [];
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
    // TODO: correctly type this instead of using `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseColor: any;
  };
}

export default class KulerComponent extends Component<KulerSignature> {
  @service declare colorUtils: ColorUtils;
  @service declare store: Store;

  // TODO: correctly type this instead of using `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _debouncedColorChange!: any;
  colorPicker!: iro.ColorPicker;
  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];
  declare ipcRenderer: IpcRenderer;

  @tracked baseColor;
  @tracked colors = [];
  @tracked palettes: Palette[] = [];
  @tracked selectedPalette!: Palette;

  constructor(owner: unknown, args: KulerSignature['Args']) {
    super(owner, args);

    this._debouncedColorChange = debounce(10, this._onColorChange);

    this.baseColor = this.args.baseColor;
    this.baseColorChanged().then(() => {
      this._setupColorWheel();

      if (typeof requireNode !== 'undefined') {
        const { ipcRenderer } = requireNode('electron');

        this.ipcRenderer = ipcRenderer;

        this._updateTouchbar();

        this.ipcRenderer.on(
          'selectKulerColor',
          async (_event: unknown, colorIndex: number) => {
            this.setSelectedIroColor(colorIndex);
          },
        );

        this.ipcRenderer.on(
          'updateKulerColor',
          async (_event: unknown, color) => {
            await this._onColorChange(color);
            this.colorPicker.setColors(
              this.selectedPalette.colors.mapBy('hex'),
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
  async baseColorChanged(selectedPaletteTypeIndex = 0): Promise<void> {
    this._destroyLeftoverPalettes();

    const palettes: Palette[] = [];

    for (const harmony of this.harmonies) {
      const palette = new Palette(harmony as harmonyTypes);

      //@ts-expect-error TODO fix this error later
      let colors = new TinyColor(this.baseColor.hex)[harmony](5);

      colors = colors.map((color: TinyColor) => {
        return this.colorUtils.createColorPOJO(color.toHexString());
      });
      colors = colors.map((color: ColorPOJO) => color.attributes);

      palette.colors = colors;
      palettes.pushObject(palette);
    }

    this.palettes = palettes;

    this.selectedPalette = this.palettes[selectedPaletteTypeIndex];
  }

  @action
  setColorAsBase(): Promise<void> {
    this.baseColor =
      this.selectedPalette.colors[this.selectedPalette.selectedColorIndex];

    return this.baseColorChanged(
      this.palettes.indexOf(this.selectedPalette),
    ).then(() => {
      this.colorPicker.setColors(
        this.selectedPalette.colors.mapBy('hex'),
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
  setSelectedPalette(event: InputEvent): void {
    const paletteName = (<HTMLInputElement>event.target).value;
    const palette = this.palettes.findBy('name', paletteName);

    if (palette) {
      this.selectedPalette = palette;
      this.colorPicker.setColors(
        this.selectedPalette.colors.mapBy('hex'),
        palette.selectedColorIndex,
      );

      this._updateTouchbar();
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

    this.selectedPalette.colors.replace(selectedColorIndex, 1, [
      newColor.attributes,
    ]);

    if (selectedColorIndex === 0) {
      this.baseColor =
        this.selectedPalette.colors[this.selectedPalette.selectedColorIndex];
      await this.setColorAsBase();
    }

    this.colorPicker.setColors(
      this.selectedPalette.colors.mapBy('hex'),
      this.selectedPalette.selectedColorIndex,
    );

    this._updateTouchbar();
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
        colors: this.selectedPalette.colors.mapBy('hex'),
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

  @action
  _updateTouchbar(): void {
    if (this.ipcRenderer) {
      const itemsToShow = {
        colorPicker: true,
        kulerColors: {
          colors: this.selectedPalette.colors,
        },
      };

      this.ipcRenderer.send('setTouchbar', itemsToShow);
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    Kuler: typeof KulerComponent;
  }
}
