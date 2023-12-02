import { action, set } from '@ember/object';
import Component from '@glimmer/component';

import ColorModel, { rgbaToHex } from 'swach/data-models/color';

export interface PrivateRGBAHex {
  _r: number;
  _g: number;
  _b: number;
  _a: number;
  _hex: string;
}

export interface PublicRGBAHex {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
}

export interface SelectedColorModel extends ColorModel, PrivateRGBAHex {}
export interface SelectedColorPOJO extends PrivateRGBAHex, PublicRGBAHex {
  name: string;
}

interface RgbaInputSignature {
  Element: HTMLInputElement;
  Args: {
    selectedColor: ColorModel;
    type: 'r' | 'g' | 'b' | 'a';
    update: (value: string | number) => void;
    updateColor: () => void;
    value?: string;
  };
}

export default class RgbaInputComponent extends Component<RgbaInputSignature> {
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
    const selectedColor: SelectedColorModel = this.args
      .selectedColor as SelectedColorModel;
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
    const selectedColor: SelectedColorModel = this.args
      .selectedColor as SelectedColorModel;
    const { type } = this.args;

    set(
      selectedColor,
      `_${type}` as keyof PrivateRGBAHex,
      this.args.selectedColor[type],
    );
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    RgbInput: typeof RgbaInputComponent;
  }
}
