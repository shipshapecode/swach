import Component from '@ember/component';
import { action, computed } from '@ember/object';
import { tagName } from '@ember-decorators/component';
import Pickr from '@simonwep/pickr';

@tagName('')
export default class ColorPicker extends Component {
  initColorPicker(element) {
    const pickr = new Pickr({
      el: element,
      container: 'main',
      useAsButton: true,

      theme: 'monolith', // or 'monolith', or 'nano'

      components: {

        // Main components
        preview: true,
        opacity: true,
        hue: true,

        // Input / output Options
        interaction: {
          hex: true,
          rgba: true,
          hsla: true,
          hsva: true,
          cmyk: true,
          input: true,
          clear: true,
          save: true
        }
      }
    });
  }
}
