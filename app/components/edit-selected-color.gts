import { fn } from '@ember/helper';
import { action, set, setProperties } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import type iro from '@jaames/iro';
import AlphaInput from './alpha-input.gts';
import HexInput from './hex-input.gts';
import RgbInput from './rgb-input.gts';
import type {
  PrivateRGBAHex,
  PublicRGBAHex,
  SelectedColorModel,
} from './rgb-input.gts';
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
  <template>
    <div class="inline-flex mt-2 w-full">
      <div
        class="input inline-block mr-2 overflow-hidden rounded whitespace-nowrap"
      >
        <HexInput
          data-test-kuler-hex
          class="bg-input-bg text-xs w-16"
          @selectedColor={{this.selectedColor}}
          @update={{fn this.updateColorInputs "hex"}}
          @updateColor={{this.updateColor}}
          @value={{this.selectedColor._hex}}
        />
      </div>

      <div
        class="input float-left overflow-hidden relative rounded-l whitespace-nowrap w-16"
      >
        <RgbInput
          data-test-kuler-r
          class="bg-input-bg text-right text-xs w-full"
          @selectedColor={{this.selectedColor}}
          @type="r"
          @update={{fn this.updateColorInputs "r"}}
          @updateColor={{this.updateColor}}
          @value={{this.selectedColor._r}}
        />
      </div>
      <div
        class="input float-left overflow-hidden relative whitespace-nowrap w-16"
      >
        <RgbInput
          data-test-kuler-g
          class="bg-input-bg text-right text-xs w-full"
          @selectedColor={{this.selectedColor}}
          @type="g"
          @update={{fn this.updateColorInputs "g"}}
          @updateColor={{this.updateColor}}
          @value={{this.selectedColor._g}}
        />
      </div>
      <div
        class="input float-left overflow-hidden relative whitespace-nowrap w-16"
      >
        <RgbInput
          data-test-kuler-b
          class="bg-input-bg text-right text-xs w-full"
          @selectedColor={{this.selectedColor}}
          @type="b"
          @update={{fn this.updateColorInputs "b"}}
          @updateColor={{this.updateColor}}
          @value={{this.selectedColor._b}}
        />
      </div>
      <div
        class="input float-left overflow-hidden relative rounded-r whitespace-nowrap w-16"
      >
        <AlphaInput
          data-test-kuler-a
          class="bg-input-bg text-right text-xs w-full"
          @selectedColor={{this.selectedColor}}
          @update={{fn this.updateColorInputs "a"}}
          @updateColor={{this.updateColor}}
          @value={{this.selectedColor._a}}
        />
      </div>
    </div>
  </template>
  @service declare colorUtils: ColorUtils;

  get selectedColor() {
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
        _a: a,
      });

      return selectedColor;
    }

    return {} as SelectedColorModel;
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
      this.args.palette.colors.map((c) => c.hex),
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
