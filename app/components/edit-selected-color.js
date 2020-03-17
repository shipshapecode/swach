import Component from '@glimmer/component';
import { action, set, setProperties } from '@ember/object';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import { TinyColor } from '@ctrl/tinycolor';

export default class EditSelectedColorComponent extends Component {
  @service colorUtils;
  
  get selectedColor() {
    const { palette } = this.args;
    if (palette) {
      const { colors } = palette;
      return colors[palette.selectedColorIndex];
    }

    return {};
  }

  @action
  enterPress(event) {
    if (event.keyCode === 13) {
      event.target.blur();
    }
  }

  /**
   *
   * @param {string} key The key to the value to change
   * @param {Event} e The change event
   */
  @action
  updateColor(key, value) {
    if (['r', 'g', 'b', 'a'].includes(key)) {
      if (key === 'a') {
        set(this.selectedColor, key, parseFloat(value / 100));
      } else {
        set(this.selectedColor, key, parseFloat(value));
      }

      set(this.selectedColor, key, parseFloat(value));
      const { r, g, b, a } = this.selectedColor;
      set(this.selectedColor, 'hex', rgbaToHex(r, g, b, a));
    }

    if (key === 'hex') {
      const tinyColor = new TinyColor(value);
      const { r, g, b, a } = tinyColor.toRgb();

      setProperties(this.selectedColor, {
        r,
        g,
        b,
        a
      });
      set(this.selectedColor, 'hex', rgbaToHex(r, g, b, a));
    }

    this.args.colorPicker.setColors(
      this.args.palette.colors.mapBy('hex'),
      this.args.palette.selectedColorIndex
    );
  }
}
