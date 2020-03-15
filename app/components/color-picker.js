import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import iro from '@jaames/iro';
import { TinyColor } from '@ctrl/tinycolor';

export default class ColorPicker extends Component {
  @service nearestColor;
  @service store;
  @tracked isShown = false;
  @tracked selectedColor = null;

  @action
  initColorPicker(element) {
    this.onChange = color => {
      if (color) {
        this.setSelectedColor(color.rgba);
      }
    };

    this.setSelectedColor('#42445a');
    this._setupColorPicker(element, '#42445a');
  }

  @action
  addColorAndClose() {
    this.args.addColor(this.selectedColor.hex);
    this.toggleIsShown();
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
      g,
      b,
      a
    };
  }

  @action toggleIsShown() {
    this.isShown = !this.isShown;
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
            borderWidth: 0
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'hue'
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha'
          }
        }
      ],
      width: 207
    });

    this.colorPicker.on('color:change', this.onChange);
  }
}
