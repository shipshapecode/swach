import Service from '@ember/service';
import { action, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import { storageFor } from 'ember-local-storage';
import { TinyColor } from '@ctrl/tinycolor';

export default class ColorUtilsService extends Service {
  @service nearestColor;
  @service store;

  @storageFor('settings') settings;

  init() {
    super.init(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  createColorPOJO(color) {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    return {
      type: 'color',
      attributes: {
        name: namedColor.name,
        createdAt: new Date(),
        hex,
        r,
        g,
        b,
        a
      }
    };
  }

  @action
  async copyColorToClipboard(color, event) {
    const isDropping =
      event &&
      event.target &&
      event.target.parentElement &&
      event.target.parentElement.classList.contains('is-dropping');

    if (!isDropping) {
      this.ipcRenderer.send('copyColorToClipboard', color.hex);

      // eslint-disable-next-line ember/no-get
      if (get(this, 'settings.sounds')) {
        const audio = new Audio('assets/sounds/pluck_short.wav');
        await audio.play();
      }

      // eslint-disable-next-line ember/no-get
      if (get(this, 'settings.notifications')) {
        new window.Notification(`${color.name} - ${color.hex}`, {
          body: `${color.hex} copied to clipboard!`,
          silent: true
        });
      }
    }
  }
}
