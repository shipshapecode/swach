import { action, set, setProperties } from '@ember/object';
import Component from '@glimmer/component';

import { TinyColor } from '@ctrl/tinycolor';

import { SelectedColorModel } from 'swach/components/rgb-input';
import { rgbaToHex } from 'swach/data-models/color';

interface HexInputArgs {
  selectedColor: SelectedColorModel;
  updateColor: () => void;
}

export default class HexInputComponent extends Component<HexInputArgs> {
  hexRegex = /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6})$/;

  @action
  enterPress(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      (<HTMLInputElement>event.target).blur();
    }
  }

  @action
  isComplete(buffer: Buffer, opts: { regex: string }): boolean {
    return new RegExp(opts.regex).test(buffer.join(''));
  }

  /**
   * Executes whenever the hex value matches the regex. We can use this to change the color values only when valid.
   * @param {Event} event The event when the hex matches the regex and is valid
   */
  @action
  onComplete(event: InputEvent): void {
    const tinyColor = new TinyColor((<HTMLInputElement>event.target).value);
    const { r, g, b, a } = tinyColor.toRgb();
    const hex = rgbaToHex(r, g, b, a);
    const alpha = parseFloat(a.toFixed(2));

    setProperties(this.args.selectedColor, {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: alpha,
      hex,
      r,
      g,
      b,
      a: alpha
    });
    this.args.updateColor();
  }

  /**
   * Resets the hex value if you navigate away
   */
  @action
  onIncomplete(): void {
    set(this.args.selectedColor, '_hex', this.args.selectedColor.hex);
  }
}
