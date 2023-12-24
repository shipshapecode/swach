import 'swach/components/color-row';

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action, set } from '@ember/object';
import { service } from '@ember/service';

import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';
import { rgbaToHex } from 'swach/data-models/color';

import type Router from '@ember/routing/router-service';
import type { Store } from 'ember-orbit';
import type {
  PrivateRGBAHex,
  PublicRGBAHex,
  SelectedColorModel,
  SelectedColorPOJO,
} from 'swach/components/rgb-input';
import type ColorModel from 'swach/data-models/color';
import type NearestColor from 'swach/services/nearest-color';
import type UndoManager from 'swach/services/undo-manager';

interface ColorPickerSignature {
  Element: HTMLDivElement;
  Args: {
    isShown: boolean;
    selectedColor: SelectedColorModel;
    saveColor: (hex: string) => Promise<ColorModel | undefined>;
    toggleIsShown: (color?: ColorModel) => void;
  };
}

export default class ColorPickerComponent extends Component<ColorPickerSignature> {
  @service declare nearestColor: NearestColor;
  @service declare router: Router;
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  colorPicker?: iro.ColorPicker;
  onChange!: (color?: ColorModel) => void;

  @tracked _selectedColor!: SelectedColorPOJO;

  get alternateColorFormats(): { hsl: string; hsv: string; rgb: string } {
    let hsl = '';
    let hsv = '';
    let rgb = '';

    if (this._selectedColor?.hex) {
      const tinyColor = new TinyColor(this._selectedColor.hex);

      hsl = tinyColor.toHslString();
      hsv = tinyColor.toHsvString();
      rgb = tinyColor.toRgbString();
    }

    return { hsl, hsv, rgb };
  }

  @action
  initColorPicker(element: HTMLElement): void {
    this.onChange = (color): void => {
      if (color) {
        this.setSelectedColor(color.rgba);
      }
    };

    const { selectedColor } = this.args;

    this.setSelectedColor(selectedColor ? selectedColor.hex : '#42445a');
    this._setupColorPicker(element, this._selectedColor.hex);
  }

  @action
  async saveColorAndClose(): Promise<void> {
    const colorToEdit = this.args.selectedColor;

    // If we passed a color to edit, save it, otherwise create a new global color
    if (colorToEdit) {
      // TODO: Consider refactoring to use a single `updateRecord` operation
      // instead of multiple `replaceAttribute` operations.
      await this.store.update((t) =>
        ['r', 'g', 'b', 'a', 'name'].map((attr) =>
          t.replaceAttribute(
            { type: 'color', id: colorToEdit.id },
            attr,
            //@ts-expect-error TODO fix this error later
            this._selectedColor[attr],
          ),
        ),
      );

      this.undoManager.setupUndoRedo();
    } else {
      this.args.saveColor(this._selectedColor?.hex);
    }

    this.args.toggleIsShown();
  }

  @action
  destroyColorPicker(): void {
    this.colorPicker?.off('color:change', this.onChange);
  }

  @action
  setSelectedColor(color: string): void {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    this._selectedColor = {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: a,
      hex,
      name: namedColor.name,
      r,
      g,
      b,
      a,
    };
  }

  @action
  updateColor(): void {
    const { r, g, b } = this._selectedColor;
    const namedColor = this.nearestColor.nearest({ r, g, b });

    set(this._selectedColor, 'name', namedColor.name);

    this.colorPicker?.setColors([this._selectedColor].mapBy('hex'));
  }

  /**
   * Updates the internal, private input values
   * @param {string} key The key to the value to change
   */
  @action
  updateColorInputs(key: keyof PublicRGBAHex, value: number | string): void {
    set(this._selectedColor, `_${key}` as keyof PrivateRGBAHex, value);
  }

  @action
  _setupColorPicker(element: HTMLElement, hex: string): void {
    // TODO: correctly type this instead of using `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.colorPicker = new (iro.ColorPicker as any)(element, {
      colors: [hex],
      layoutDirection: 'vertical',
      layout: [
        {
          component: iro.ui.Box,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            width: 190,
          },
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 20,
            sliderSize: 10,
            sliderType: 'hue',
            width: 300,
          },
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha',
            width: 300,
          },
        },
      ],
      width: 207,
    });

    this.colorPicker?.on('color:change', this.onChange);
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ColorPicker: typeof ColorPickerComponent;
  }
}
