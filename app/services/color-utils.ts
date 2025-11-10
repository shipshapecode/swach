import { action } from '@ember/object';
import Service, { service } from '@ember/service';

import { storageFor } from 'ember-local-storage';
import { orbit, type Store } from 'ember-orbit';

import { TinyColor } from '@ctrl/tinycolor';
import type { ColorInput } from '@ctrl/tinycolor';

import { rgbaToHex } from '../data-models/color.ts';
import type ColorModel from '../data-models/color.ts';
import type NearestColor from '../services/nearest-color.ts';
import type { SettingsStorage } from '../storages/settings.ts';

export interface ColorPOJO {
  type: 'color';
  id?: string;
  attributes: {
    name: string;
    createdAt: Date;
    hex?: string;
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export default class ColorUtilsService extends Service {
  @orbit declare store: Store;

  @service nearestColor!: NearestColor;

  @storageFor('settings') settings!: SettingsStorage;

  declare ipcRenderer: Window['electronAPI']['ipcRenderer'];

  constructor() {
    super(...arguments);

    if (typeof window !== 'undefined' && window.electronAPI) {
      const { ipcRenderer } = window.electronAPI;

      this.ipcRenderer = ipcRenderer;
    }
  }

  @action
  createColorPOJO(color: ColorInput, id?: string): ColorPOJO {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    return {
      type: 'color',
      id,
      attributes: {
        name: namedColor.name,
        createdAt: new Date(),
        hex,
        r,
        g,
        b,
        a,
      },
    };
  }

  @action
  async copyColorToClipboard(color?: ColorModel, event?: Event): Promise<void> {
    if (this.ipcRenderer) {
      const target = <HTMLElement>event?.target;
      const isDropping =
        target?.parentElement?.classList.contains('is-dropping');
      const colorFormat = this.settings.get('defaultColorFormat');

      if (!isDropping && color) {
        this.ipcRenderer.send('copyColorToClipboard', color[colorFormat]);

        if (this.settings.get('sounds')) {
          const audio = new Audio('assets/sounds/pluck_short.mp3');

          try {
            await audio.play();
          } catch {
            // Do nothing
          }
        }

        if (this.settings.get('notifications')) {
          new window.Notification(`${color.name} - ${color[colorFormat]}`, {
            body: `${color[colorFormat]} copied to clipboard!`,
            silent: true,
          });
        }
      }
    }
  }
}
