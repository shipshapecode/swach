import Component from '@ember/component';
import {action} from '@ember/object';
import Pickr from '@simonwep/pickr';

export default class ContrastChecker extends Component {
  backgroundColor = '#ffffff';
  foregroundColor = '#000000';

  @action
  initBackgroundColorPicker(element) {
    this.bgPickr = new Pickr({
      el: element,
      container: element,
      inline: true,
      useAsButton: true,

      showAlways: true,
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
  }

  @action
  initForegroundColorPicker(element) {
    this.fgPickr = new Pickr({
      el: element,
      container: element,
      inline: true,
      useAsButton: true,

      showAlways: true,
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
  }
}
