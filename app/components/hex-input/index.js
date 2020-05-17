import Component from '@glimmer/component';
import { action, set, setProperties } from '@ember/object';
import { TinyColor } from '@ctrl/tinycolor';
import { rgbaToHex } from 'swach/data-models/color';

export default class HexInputComponent extends Component {
  hexRegex = /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6})$/;

  @action
  isComplete(buffer, opts) {
    return new RegExp(opts.regex).test(buffer.join(''));
  }

  /**
   * Executes whenever the hex value matches the regex. We can use this to change the color values only when valid.
   * @param {Event} event The event when the hex matches the regex and is valid
   */
  @action
  onComplete(event) {
    const tinyColor = new TinyColor(event.target.value);
    const { r, g, b, a } = tinyColor.toRgb();
    const hex = rgbaToHex(r, g, b, a);

    setProperties(this.args.selectedColor, {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: a,
      hex,
      r,
      g,
      b,
      a
    });
    this.args.updateColor();
  }

  /**
   * Resets the hex value if you navigate away
   */
  @action
  onIncomplete() {
    set(this.args.selectedColor, '_hex', this.args.selectedColor.hex);
  }
}
