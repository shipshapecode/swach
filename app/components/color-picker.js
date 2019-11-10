import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import Pickr from '@simonwep/pickr';

export default class ColorPicker extends Component {
  @service nearestColor;
  @service store;
  @tracked isShown = false;
  @tracked selectedColor = null;

  @action
  initColorPicker(element) {
    this.setSelectedColor('#42445a');

    this.pickr = new Pickr({
      el: element,
      container: element,
      comparison: false,
      default: this.selectedColor.hex,
      inline: true,
      useAsButton: true,

      showAlways: true,

      theme: 'monolith',

      components: {
        // Main components
        preview: false,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
          hex: false,
          rgba: false,
          hsla: false,
          hsva: false,
          cmyk: false,
          input: true,
          clear: false,
          save: false
        }
      }
    });

    this.onChange = (color) => {
      if (color) {
        this.setSelectedColor(color.toHEXA().toString());
      }
    };

    this.pickr.on('change', this.onChange);
  }

  @action
  addColorAndClose() {
    this.args.addColor(this.selectedColor.hex);
    this.toggleIsShown();
  }

  @action
  destroyColorPickr() {
    this.pickr.off('change', this.onChange);
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
}
