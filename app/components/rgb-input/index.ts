import { action, set } from '@ember/object';
import Component from '@glimmer/component';

import ColorModel, { rgbaToHex } from 'swach/data-models/color';

interface PrivateRGBAHex {
  _r: number;
  _g: number;
  _b: number;
  _a: number;
  _hex: string;
}

export interface SelectedColorPOJO extends ColorModel, PrivateRGBAHex {}

interface RgbaInputArgs {
  selectedColor: ColorModel;
  type: 'r' | 'g' | 'b' | 'a';
  updateColor: () => void;
}

export default class RgbaInputComponent extends Component<RgbaInputArgs> {
  rgbRegex = /^\d{0,3}$/;

  @action
  enterPress(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      (<HTMLInputElement>event.target).blur();
    }
  }

  @action
  isComplete(buffer: Buffer, opts: { regex: string }): boolean {
    const value = buffer.join('');
    return Boolean(value.length) && new RegExp(opts.regex).test(value);
  }

  /**
   * When the rgb input value passes the regex, set the value, and update the hex values and color.
   * @param {Event} event
   */
  @action
  onComplete(event: InputEvent): void {
    const selectedColor: SelectedColorPOJO = this.args
      .selectedColor as SelectedColorPOJO;
    const { type } = this.args;
    let value = parseFloat((<HTMLInputElement>event.target).value);

    if (value > 255) {
      value = 255;
    }

    set(selectedColor, type, value);
    set(selectedColor, `_${type}` as keyof PrivateRGBAHex, value);

    const { r, g, b, a } = selectedColor;
    const hex = rgbaToHex(r, g, b, a);
    set(selectedColor, '_hex', hex);
    set(selectedColor, 'hex', hex);
    this.args.updateColor();
  }

  /**
   * Resets the rgb input value if you navigate away
   */
  @action
  onIncomplete(): void {
    const selectedColor: SelectedColorPOJO = this.args
      .selectedColor as SelectedColorPOJO;
    const { type } = this.args;

    set(
      selectedColor,
      `_${type}` as keyof PrivateRGBAHex,
      this.args.selectedColor[type]
    );
  }
}
