import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import ColorModel, { rgbaToHex } from 'swach/data-models/color';

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
  onComplete(event): void {
    const { selectedColor, type } = this.args;
    let value = parseFloat(event.target.value);

    if (value > 255) {
      value = 255;
    }

    set(selectedColor, type, value);
    set(selectedColor, `_${type}`, value);

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
    set(
      this.args.selectedColor,
      `_${this.args.type}`,
      this.args.selectedColor[this.args.type]
    );
  }
}
