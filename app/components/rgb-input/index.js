import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { rgbaToHex } from 'swach/data-models/color';

export default class RgbaInputComponent extends Component {
  rgbRegex = /^\d{0,3}$/;

  @action
  isComplete(buffer, opts) {
    const value = buffer.join('');
    return Boolean(value.length) && new RegExp(opts.regex).test(value);
  }

  /**
   * When the rgb input value passes the regex, set the value, and update the hex values and color.
   * @param {Event} event
   */
  @action
  onComplete(event) {
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
  onIncomplete() {
    set(
      this.args.selectedColor,
      `_${this.args.type}`,
      this.args.selectedColor[this.args.type]
    );
  }
}
