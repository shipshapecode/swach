import { concat } from '@ember/helper';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import type Owner from '@ember/owner';
import didInsert from '@ember/render-modifiers/modifiers/did-insert';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import svgJar from 'ember-svg-jar/helpers/svg-jar';
import { type IroColorValue } from '@irojs/iro-core';
import iro from '@jaames/iro';
import type { IpcRenderer } from 'electron';
import { hex, score } from 'wcag-contrast';
import htmlSafe from '../helpers/html-safe.ts';

interface ContrastCheckerSignature {
  Element: HTMLDivElement;
}

export default class ContrastChecker extends Component<ContrastCheckerSignature> {
  <template>
    <div class="w-full" ...attributes>
      <div
        data-test-contrast-preview
        class="rounded-sm w-full"
        style={{htmlSafe
          (concat
            "background-color: "
            this.backgroundColor
            "; "
            "color: "
            this.foregroundColor
          )
        }}
      >
        <div
          class="flex justify-center p-4 pb-2 w-full"
          style={{htmlSafe "-webkit-app-region: no-drag"}}
        >
          <div class="flex items-center w-full">
            <h1 class="font-black text-4xl" data-test-wcag-string>
              {{this.wcagString}}
            </h1>
            <div class="flex grow justify-end">
              <div
                data-test-wcag-score
                class="h-8 leading-none p-2 rounded-sm"
                style={{htmlSafe
                  (concat
                    "background-color: "
                    this.foregroundColor
                    "; "
                    "color: "
                    this.backgroundColor
                  )
                }}
              >
                {{this.wcagScore}}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center pl-4 pr-4 w-full">
          <div class="flex max-w-lg w-full">
            <h2 class="font-bold text-lg">
              Check Contrast
            </h2>
          </div>
        </div>

        <div class="flex justify-center w-full">
          <p class="p-4 text-sm">
            Enter a
            <span class="font-bold">
              text color
            </span>
            and a
            <span class="font-bold">
              background color
            </span>
            in hexadecimal format or choose a color using the color picker.
          </p>
        </div>
      </div>

      <div
        class="bg-menu color-pickers-container flex justify-between mt-4 p-4 rounded-sm w-full"
        style={{htmlSafe "-webkit-app-region: no-drag"}}
      >
        <div class="background-color-picker-container mr-2 w-full">
          <div
            class="background-color-picker"
            {{didInsert this.initBackgroundColorPicker}}
          ></div>

          <div class="relative w-36">
            <input
              data-test-bg-input
              class="input rounded-sm mt-3 w-36"
              type="text"
              value={{this.backgroundColor}}
              {{on "blur-sm" this.onBlurBg}}
              {{on "keypress" this.enterPress}}
            />

            <button
              class="absolute mr-2 mt-4 right-0 top-0"
              type="button"
              {{on "click" this.launchContrastBgPicker}}
            >
              {{svgJar "drop" class="menu-icon" height="18" width="18"}}
            </button>
          </div>
        </div>

        <div class="foreground-color-picker-container ml-2 w-full">
          <div
            class="foreground-color-picker ml-1"
            {{didInsert this.initForegroundColorPicker}}
          ></div>

          <div class="relative w-36">
            <input
              data-test-fg-input
              class="input rounded-sm mt-3 w-36"
              type="text"
              value={{this.foregroundColor}}
              {{on "blur-sm" this.onBlurFg}}
              {{on "keypress" this.enterPress}}
            />

            <button
              class="absolute mr-2 mt-4 right-0 top-0"
              type="button"
              {{on "click" this.launchContrastFgPicker}}
            >
              {{svgJar "drop" class="menu-icon" height="18" width="18"}}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
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

  constructor(owner: Owner, args: object) {
    super(owner, args);

    if (typeof requireNode !== 'undefined') {
      const { ipcRenderer } = requireNode('electron');

      this.ipcRenderer = ipcRenderer;

      this.ipcRenderer.on(
        'pickContrastBgColor',
        (_event, color: IroColorValue) => {
          this.setBgColor(color);
        }
      );

      this.ipcRenderer.on(
        'pickContrastFgColor',
        (_event, color: IroColorValue) => {
          this.setFgColor(color);
        }
      );
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
    this.setBgColor((ev.target as HTMLInputElement).value as IroColorValue);
  }

  setBgColor(color: IroColorValue) {
    try {
      this.bgPickr.setColors([color]);
      this.backgroundColor = this.bgPickr.color.hexString;
    } catch {
      // TODO: maybe mention the color is invalid here?
    }
  }

  @action
  onBlurFg(ev: Event) {
    this.setFgColor((ev.target as HTMLInputElement).value);
  }

  setFgColor(color: IroColorValue) {
    try {
      this.fgPickr.setColors([color]);
      this.foregroundColor = this.fgPickr.color.hexString;
    } catch {
      // TODO: maybe mention the color is invalid here?
    }
  }
}
