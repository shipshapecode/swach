import { action } from '@ember/object';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import iro from '@jaames/iro';
import type { IpcRenderer } from 'electron';
import { hex, score } from 'wcag-contrast';

interface ContrastCheckerSignature {
  Element: HTMLDivElement;
}

export default class ContrastChecker extends Component<ContrastCheckerSignature> {
  @tracked backgroundColor = '#ffffff';
  @tracked foregroundColor = '#000000';

  declare bgPickr: iro.ColorPicker;
  declare fgPickr: iro.ColorPicker;
  declare ipcRenderer: IpcRenderer;
  declare onBgChange: (color?: iro.Color) => void;
  declare onFgChange: (color?: iro.Color) => void;

  get wcagScore() {
    return hex(this.backgroundColor, this.foregroundColor).toFixed(2);
  }

  get wcagString() {
    return score(this.wcagScore);
  }

  constructor(owner: unknown, args: object) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on('pickContrastBgColor', async (_event, color) => {
        this.setBgColor(color);
      });

      this.ipcRenderer.on('pickContrastFgColor', async (_event, color) => {
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
  initBackgroundColorPicker(element: HTMLElement) {
    // @ts-expect-error TS doesn't like the `new` but we need it
    this.bgPickr = new iro.ColorPicker(element, {
      colors: [this.backgroundColor],
      layout: [
        {
          component: iro.ui.Box,
          options: {},
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'hue',
          },
        },
      ],
      width: 140,
    });

    this.onBgChange = (color?: iro.Color) => {
      if (color) {
        this.backgroundColor = color.hexString;
      }
    };

    this.bgPickr.on('color:change', this.onBgChange);
  }

  @action
  initForegroundColorPicker(element: HTMLElement) {
    // @ts-expect-error TS doesn't like the `new` but we need it
    this.fgPickr = new iro.ColorPicker(element, {
      colors: [this.foregroundColor],
      layout: [
        {
          component: iro.ui.Box,
          options: {},
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'hue',
          },
        },
      ],
      width: 140,
    });

    this.onFgChange = (color?: iro.Color) => {
      if (color) {
        this.foregroundColor = color.hexString;
      }
    };

    this.fgPickr.on('color:change', this.onFgChange);
  }

  @action
  enterPress(event: KeyboardEvent) {
    if (event.keyCode === 13) {
      (event.target as HTMLInputElement).blur();
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
  onBlurBg(ev: Event) {
    this.setBgColor((ev.target as HTMLInputElement).value);
  }

  // TODO: correctly type this instead of using `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setBgColor(color: any) {
    try {
      this.bgPickr.setColors([color]);
      this.backgroundColor = this.bgPickr.color.hexString;
    } catch (err) {
      // TODO: maybe mention the color is invalid here?
    }
  }

  @action
  onBlurFg(ev: Event) {
    this.setFgColor((ev.target as HTMLInputElement).value);
  }

  // TODO: correctly type this instead of using `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFgColor(color: any) {
    try {
      this.fgPickr.setColors([color]);
      this.foregroundColor = this.fgPickr.color.hexString;
    } catch (err) {
      // TODO: maybe mention the color is invalid here?
    }
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ContrastChecker: typeof ContrastChecker;
  }
}
