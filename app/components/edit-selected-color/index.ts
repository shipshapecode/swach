import { action, set, setProperties } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import iro from '@jaames/iro';

import {
  PrivateRGBAHex,
  PublicRGBAHex,
  SelectedColorModel
} from 'swach/components/rgb-input';
import type PaletteModel from 'swach/data-models/palette';
import type ColorUtils from 'swach/services/color-utils';

interface EditSelectedColorSignature {
  Element: HTMLDivElement;
  Args: {
    colorPicker: iro.ColorPicker;
    palette: PaletteModel;
  };
}

export default class EditSelectedColorComponent extends Component<EditSelectedColorSignature> {
  @service declare colorUtils: ColorUtils;

  get selectedColor(): SelectedColorModel | Record<string, unknown> {
    const { palette } = this.args;
    if (palette) {
      const { colors } = palette;
      const selectedColor = colors[
        palette.selectedColorIndex
      ] as SelectedColorModel;
      const { hex, r, g, b, a } = selectedColor;
      setProperties(selectedColor, {
        _hex: hex,
        _r: r,
        _b: b,
        _g: g,
        _a: a
      });
      return selectedColor;
    }

    return {};
  }

  /**
   *
   * @param {string} key The key to the value to change
   * @param {Event} e The change event
   */
  // @action
  // updateColor(key, value) {
  //   if (['r', 'g', 'b', 'a'].includes(key)) {
  //     if (key === 'a') {
  //       set(this.selectedColor, key, parseFloat(value / 100));
  //     } else {
  //       set(this.selectedColor, key, parseFloat(value));
  //     }

  //     set(this.selectedColor, key, parseFloat(value));
  //     const { r, g, b, a } = this.selectedColor;
  //     set(this.selectedColor, 'hex', rgbaToHex(r, g, b, a));
  //   }

  //   if (key === 'hex') {
  //     const tinyColor = new TinyColor(value);
  //     const { r, g, b, a } = tinyColor.toRgb();

  //     setProperties(this.selectedColor, {
  //       r,
  //       g,
  //       b,
  //       a
  //     });
  //     set(this.selectedColor, 'hex', rgbaToHex(r, g, b, a));
  //   }
  // }

  @action
  updateColor(): void {
    this.args.colorPicker.setColors(
      this.args.palette.colors.mapBy('hex'),
      this.args.palette.selectedColorIndex
    );
  }

  /**
   * Updates the internal, private input values
   * @param key The key to the value to change
   * @param value The value from the input mask
   */
  @action
  updateColorInputs(key: keyof PublicRGBAHex, value: number | string): void {
    set(this.selectedColor, `_${key}` as keyof PrivateRGBAHex, value);
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    EditSelectedColor: typeof EditSelectedColorComponent;
  }
}
