import Component from '@glimmer/component';
import { action, set } from '@ember/object';
import { rgbaToHex } from 'swach/data-models/color';

export default class AlphaInputComponent extends Component {
  alphaRegex = /^[1]$|^[0]$|^(0\.[0-9]{1,2})$/;

  @action
  enterPress(event) {
    if (event.keyCode === 13) {
      event.target.blur();
    }
  }

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
    const { selectedColor } = this.args;
    let value = parseFloat(event.target.value);

    if (value > 1) {
      value = 1;
    }

    set(selectedColor, 'a', value);
    set(selectedColor, `_a`, value);

    const { r, g, b, a } = selectedColor;
    const hex = rgbaToHex(r, g, b, a);
    set(selectedColor, '_hex', hex);
    set(selectedColor, 'hex', hex);
    this.args.updateColor();
  }

  /**
   * Resets the alpha input value if you navigate away
   */
  @action
  onIncomplete() {
    set(this.args.selectedColor, `_a`, this.args.selectedColor.a);
  }
}
