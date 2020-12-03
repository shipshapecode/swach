import Service from '@ember/service';
import { action, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import { storageFor } from 'ember-local-storage';
import { TinyColor } from '@ctrl/tinycolor';
import NearestColor from 'swach/services/nearest-color';
import Color from 'swach/data-models/color';
// import { Store } from 'ember-orbit/addon/index';

export default class ColorUtilsService extends Service {
  @service nearestColor!: NearestColor;
  @service store!: any;

  ipcRenderer: any;

  @storageFor('settings') settings?: {};

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      let { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  createColorPOJO(color: any) {
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
  async copyColorToClipboard(color: Color, event: any) {
    const isDropping =
      event &&
      event.target &&
      event.target.parentElement &&
      event.target.parentElement.classList.contains('is-dropping');

    if (!isDropping) {
      this.ipcRenderer.send('copyColorToClipboard', color.hex);

      // @ts-ignore
      // eslint-disable-next-line ember/no-get
      if (get(this, 'settings.sounds')) {
        const audio = new Audio('assets/sounds/pluck_short.wav');
        await audio.play();
      }

      // @ts-ignore
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
