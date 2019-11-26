import Component from '@ember/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Pickr from '@simonwep/pickr';
import { hex, score } from 'wcag-contrast';

export default class ContrastChecker extends Component {
  @tracked backgroundColor = '#ffffff';
  @tracked foregroundColor = '#000000';

  get wcagScore() {
    return hex(this.backgroundColor, this.foregroundColor).toFixed(2);
  }

  get wcagString() {
    return score(this.wcagScore);
  }

  @action
  initBackgroundColorPicker(element) {
    this.bgPickr = new Pickr({
      el: element,
      container: element,
      default: this.backgroundColor,
      comparison: false,
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

    this.onBgChange = (color) => {
      if (color) {
        this.backgroundColor = color.toHEXA().toString();
      }
    };

    this.bgPickr.on('change', this.onBgChange);
  }

  @action
  initForegroundColorPicker(element) {
    this.fgPickr = new Pickr({
      el: element,
      container: element,
      comparison: false,
      default: this.foregroundColor,
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

    this.onFgChange = (color) => {
      if (color) {
        this.foregroundColor = color.toHEXA().toString();
      }
    };

    this.fgPickr.on('change', this.onFgChange);
  }
}
