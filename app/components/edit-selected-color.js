import Component from '@glimmer/component';
import { action, set, setProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import mapBy from 'ember-array-utils/utils/map-by';

export default class EditSelectedColorComponent extends Component {
  @service colorUtils;

  get selectedColor() {
    const { palette } = this.args;
    if (palette) {
      const { colors } = palette;
      const selectedColor = colors[palette.selectedColorIndex];
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
  updateColor() {
    this.args.colorPicker.setColors(
      mapBy(this.args.palette.colors, 'hex'),
      this.args.palette.selectedColorIndex
    );
  }

  /**
   * Updates the internal, private input values
   * @param {string} key The key to the value to change
   * @param {number|string} value The value from the input mask
   */
  @action
  updateColorInputs(key, value) {
    set(this.selectedColor, `_${key}`, value);
  }
}
