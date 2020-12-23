import Service from '@ember/service';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { rgbaToHex } from 'swach/data-models/color';
import { storageFor } from 'ember-local-storage';
import { TinyColor } from '@ctrl/tinycolor';
import { Store } from 'ember-orbit/addon/index';
import NearestColor from 'swach/services/nearest-color';
import Color from 'swach/data-models/color';
import { SettingsStorage } from 'swach/storages/settings';

interface ColorPOJO {
  type: 'color';
  id?: string;
  attributes: {
    name: string;
    createdAt: Date;
    hex: string;
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export default class ColorUtilsService extends Service {
  @service nearestColor!: NearestColor;
  @service store!: Store;

  ipcRenderer: any;

  @storageFor('settings') settings!: SettingsStorage;

  constructor() {
    super(...arguments);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');
      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  createColorPOJO(color: any): ColorPOJO {
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
  async copyColorToClipboard(color: Color, event?: any): Promise<void> {
    const isDropping =
      event &&
      event.target &&
      event.target.parentElement &&
      event.target.parentElement.classList.contains('is-dropping');

    if (!isDropping) {
      this.ipcRenderer.send('copyColorToClipboard', color.hex);

      if (this.settings.get('sounds')) {
        const audio = new Audio('assets/sounds/pluck_short.wav');
        await audio.play();
      }

      if (this.settings.get('notifications')) {
        new window.Notification(`${color.name} - ${color.hex}`, {
          body: `${color.hex} copied to clipboard!`,
          silent: true
        });
      }
    }
  }
}
