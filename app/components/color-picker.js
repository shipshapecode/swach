import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import iro from '@jaames/iro';

export default class ColorPicker extends Component {
  @service nearestColor;
  @service store;
  @tracked isShown = false;
  @tracked selectedColor = null;

  @action
  initColorPicker(element) {
    this.onChange = color => {
      if (color) {
        this.setSelectedColor(color.hexString);
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
    const namedColor = this.nearestColor.nearest(color);

    this.selectedColor = {
      hex: color,
      name: namedColor.name
    };
  }

  @action toggleIsShown() {
    this.isShown = !this.isShown;
  }

  @action
  _setupColorPicker(element, color) {
    this.colorPicker = new iro.ColorPicker(element, {
      colors: [color],
      layout: [
        {
          component: iro.ui.Box,
          options: {}
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'hue'
          }
        }
      ],
      width: 207
    });

    this.colorPicker.on('color:change', this.onChange);
  }
}
