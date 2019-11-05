import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import Pickr from '@simonwep/pickr';

@tagName('')
export default class ColorPicker extends Component {
  @action
  initColorPicker(element) {
    this.pickr = new Pickr({
      el: element,
      container: 'main',
      useAsButton: true,

      theme: 'monolith',

      components: {
        // Main components
        preview: true,
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
          clear: true,
          save: true
        }
      }
    });

    this.onSave = (color) => {
      if (color) {
        this.addColor(color.toHEXA().toString());
      }

      this.pickr.hide();
    };

    this.pickr.on('save', this.onSave);
  }

  @action
  destroyColorPickr() {
    this.pickr.off('save', this.onSave);
  }
}
