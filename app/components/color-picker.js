import Component from '@glimmer/component';
import { action, set, setProperties } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import iro from '@jaames/iro';
import { TinyColor } from '@ctrl/tinycolor';

export default class ColorPicker extends Component {
  @service nearestColor;
  @service store;
  @service undoManager;

  @tracked selectedColor = null;

  @action
  initColorPicker(element) {
    this.onChange = (color) => {
      if (color) {
        this.setSelectedColor(color.rgba);
      }
    };

    const { selectedColor } = this.args;
    this.setSelectedColor(selectedColor ? selectedColor.hex : '#42445a');
    this._setupColorPicker(element, this.selectedColor.hex);
  }

  @action
  async saveColorAndClose() {
    const colorToEdit = this.args.selectedColor;
    // If we passed a color to edit, save it, otherwise create a new global color
    if (colorToEdit) {
      await this.store.update((t) => {
        return [
          t.updateRecord({
            type: 'color',
            id: colorToEdit.id,
            attributes: { ...this.selectedColor }
          })
        ];
      });

      this.undoManager.setupUndoRedo();
    } else {
      this.args.saveColor(this.selectedColor.hex);
    }

    this.args.toggleIsShown();
  }

  @action
  destroyColorPickr() {
    this.colorPicker.off('color:change', this.onChange);
  }

  @action
  setSelectedColor(color) {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    this.selectedColor = {
      name: namedColor.name,
      hex,
      r,
      g,
      b,
      a
    };
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

    this.colorPicker.setColors([this.selectedColor].mapBy('hex'));
  }

  @action
  _setupColorPicker(element, color) {
    this.colorPicker = new iro.ColorPicker(element, {
      colors: [color],
      layoutDirection: 'vertical',
      layout: [
        {
          component: iro.ui.Box,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            width: 200
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 20,
            sliderSize: 10,
            sliderType: 'hue',
            width: 300
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha',
            width: 300
          }
        }
      ],
      width: 207
    });

    this.colorPicker.on('color:change', this.onChange);
  }
}
