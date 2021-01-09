import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import iro from '@jaames/iro';
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

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on('pickContrastBgColor', async (event, color) => {
        this.setBgColor(color);
      });

      this.ipcRenderer.on('pickContrastFgColor', async (event, color) => {
        this.setFgColor(color);
      });
    }
  }

  willDestroy() {
    super.willDestroy();
    if (this.ipcRenderer) {
      this.ipcRenderer.removeAllListeners('pickContrastBgColor');
      this.ipcRenderer.removeAllListeners('pickContrastFgColor');
    }
  }

  @action
  initBackgroundColorPicker(element) {
    this.bgPickr = new iro.ColorPicker(element, {
      colors: [this.backgroundColor],
      layout: [
        {
          component: iro.ui.Box,
          options: {}
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'hue'
          }
        }
      ],
      width: 140
    });

    this.onBgChange = (color) => {
      if (color) {
        this.backgroundColor = color.hexString;
      }
    };

    this.bgPickr.on('color:change', this.onBgChange);
  }

  @action
  initForegroundColorPicker(element) {
    this.fgPickr = new iro.ColorPicker(element, {
      colors: [this.foregroundColor],
      layout: [
        {
          component: iro.ui.Box,
          options: {}
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'hue'
          }
        }
      ],
      width: 140
    });

    this.onFgChange = (color) => {
      if (color) {
        this.foregroundColor = color.hexString;
      }
    };

    this.fgPickr.on('color:change', this.onFgChange);
  }

  @action
  enterPress(event) {
    if (event.keyCode === 13) {
      event.target.blur();
    }
  }

  @action
  launchContrastBgPicker() {
    this.ipcRenderer.send('launchContrastBgPicker');
  }

  @action
  launchContrastFgPicker() {
    this.ipcRenderer.send('launchContrastFgPicker');
  }

  @action
  onBlurBg(ev) {
    this.setBgColor(ev.target.value);
  }

  setBgColor(color) {
    try {
      this.bgPickr.setColors([color], 0);
      this.backgroundColor = this.bgPickr.color.hexString;
    } catch (err) {
      // TODO: maybe mention the color is invalid here?
    }
  }

  @action
  onBlurFg(ev) {
    this.setFgColor(ev.target.value);
  }

  setFgColor(color) {
    try {
      this.fgPickr.setColors([color], 0);
      this.foregroundColor = this.fgPickr.color.hexString;
    } catch (err) {
      // TODO: maybe mention the color is invalid here?
    }
  }
}
