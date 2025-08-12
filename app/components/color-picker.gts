import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { action, set } from '@ember/object';
import didInsert from '@ember/render-modifiers/modifiers/did-insert';
import willDestroy from '@ember/render-modifiers/modifiers/will-destroy';
import type Router from '@ember/routing/router-service';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import type { Store } from 'ember-orbit';
// @ts-expect-error TODO: fix this
import EmberPopover from 'ember-tooltips/components/ember-popover';
import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';
import { rgbaToHex } from '../data-models/color.ts';
import type ColorModel from '../data-models/color.ts';
import type NearestColor from '../services/nearest-color.ts';
import type UndoManager from '../services/undo-manager.ts';
import AlphaInput from './alpha-input.ts';
import ColorRow from './color-row.ts';
import HexInput from './hex-input.ts';
import RgbInput from './rgb-input.ts';
import type {
  PrivateRGBAHex,
  PublicRGBAHex,
  SelectedColorModel,
  SelectedColorPOJO,
} from './rgb-input.ts';

interface ColorPickerSignature {
  Element: HTMLDivElement;
  Args: {
    isShown: boolean;
    selectedColor?: SelectedColorModel;
    saveColor: (hex: string) => Promise<ColorModel | undefined>;
    toggleIsShown: (color?: SelectedColorModel) => void;
  };
}

export default class ColorPickerComponent extends Component<ColorPickerSignature> {
  <template>
    {{#if @isShown}}
      <EmberPopover
        @arrowClass="color-picker-arrow custom-arrow"
        @event="none"
        @innerClass="h-full w-full"
        @isShown={{@isShown}}
        @side="top-end"
        @spacing={{10}}
        @tooltipClass="color-picker-popover bg-main border-menu fixed h-full m-0 pb-4 pl-3 pr-3 pt-5 text-alt w-screen"
      >
        <div class="h-full relative w-full" data-test-color-picker>
          <ColorRow @color={{this._selectedColor}} @showActions={{false}} />

          <div class="bg-menu flex p-4 relative rounded">
            <div
              class="flex-1 w-auto"
              id="color-picker-container"
              {{didInsert this.initColorPicker}}
              {{willDestroy this.destroyColorPicker}}
            ></div>

            <div class="absolute grow mt-4 mr-4 right-0 top-0">
              <HexInput
                data-test-color-picker-hex
                class="input rounded mb-4 w-24"
                @selectedColor={{this._selectedColor}}
                @update={{fn this.updateColorInputs "hex"}}
                @updateColor={{this.updateColor}}
                @value={{this._selectedColor._hex}}
              />

              <div
                class="input overflow-hidden relative rounded-t whitespace-nowrap w-24"
              >
                <RgbInput
                  data-test-color-picker-r
                  class="bg-input-bg text-right text-xs w-full"
                  @selectedColor={{this._selectedColor}}
                  @type="r"
                  @update={{fn this.updateColorInputs "r"}}
                  @updateColor={{this.updateColor}}
                  @value={{this._selectedColor._r}}
                />
              </div>

              <div
                class="input overflow-hidden relative whitespace-nowrap w-24"
              >
                <RgbInput
                  data-test-color-picker-g
                  class="bg-input-bg text-right text-xs w-full"
                  @selectedColor={{this._selectedColor}}
                  @type="g"
                  @update={{fn this.updateColorInputs "g"}}
                  @updateColor={{this.updateColor}}
                  @value={{this._selectedColor._g}}
                />
              </div>

              <div
                class="input overflow-hidden relative whitespace-nowrap w-24"
              >
                <RgbInput
                  data-test-color-picker-b
                  class="bg-input-bg text-right text-xs w-full"
                  @selectedColor={{this._selectedColor}}
                  @type="b"
                  @update={{fn this.updateColorInputs "b"}}
                  @updateColor={{this.updateColor}}
                  @value={{this._selectedColor._b}}
                />
              </div>

              <div
                class="input overflow-hidden relative rounded-b whitespace-nowrap w-24"
              >
                <AlphaInput
                  data-test-color-picker-a
                  class="bg-input-bg text-right text-xs w-full"
                  @selectedColor={{this._selectedColor}}
                  @update={{fn this.updateColorInputs "a"}}
                  @updateColor={{this.updateColor}}
                  @value={{this._selectedColor._a}}
                />
              </div>
            </div>
          </div>

          <div class="flex w-full">
            <div class="bg-menu flex-1 mt-3 mr-3 px-2 py-4 relative rounded">
              <div class="flex flex-col h-full w-full">
                <div
                  class="font-medium text-xxs text-main-text w-full whitespace-nowrap"
                >
                  {{this._selectedColor.hex}}
                </div>

                <span class="text-xs">
                  HEX
                </span>
              </div>
            </div>

            <div class="bg-menu flex-1 mt-3 px-2 py-4 relative rounded">
              <div class="flex flex-col h-full w-full">
                <div
                  class="font-medium text-xxs text-main-text w-full whitespace-nowrap"
                >
                  {{this.alternateColorFormats.rgb}}
                </div>

                <span class="text-xs">
                  RGB
                </span>
              </div>
            </div>
          </div>

          <div class="flex w-full">
            <div class="bg-menu flex-1 mt-3 mr-3 px-2 py-4 relative rounded">
              <div class="flex flex-col h-full w-full">
                <div
                  class="font-medium text-xxs text-main-text w-full whitespace-nowrap"
                >
                  {{this.alternateColorFormats.hsl}}
                </div>

                <span class="text-xs">
                  HSL
                </span>
              </div>
            </div>

            <div class="bg-menu flex-1 mt-3 px-2 py-4 relative rounded">
              <div class="flex flex-col h-full w-full">
                <div
                  class="font-medium text-xxs text-main-text w-full whitespace-nowrap"
                >
                  {{this.alternateColorFormats.hsv}}
                </div>

                <span class="text-xs">
                  HSV
                </span>
              </div>
            </div>
          </div>

          <div class="absolute bottom-0 flex mb-12 w-full">
            <button
              data-test-color-picker-cancel
              class="btn flex-1 mr-1 p-2"
              type="button"
              {{on "click" @toggleIsShown}}
            >
              Cancel
            </button>

            <button
              data-test-color-picker-save
              class="btn btn-primary grow ml-1 p-2"
              type="button"
              {{on "click" this.saveColorAndClose}}
            >
              🎉 Save color
            </button>
          </div>
        </div>
      </EmberPopover>
    {{/if}}
  </template>
  @service declare nearestColor: NearestColor;
  @service declare router: Router;
  @service declare store: Store;
  @service declare undoManager: UndoManager;

  colorPicker?: iro.ColorPicker;
  onChange!: (color?: ColorModel) => void;

  @tracked _selectedColor!: ColorModel | SelectedColorPOJO;

  get alternateColorFormats(): { hsl: string; hsv: string; rgb: string } {
    let hsl = '';
    let hsv = '';
    let rgb = '';

    if (this._selectedColor?.hex) {
      const tinyColor = new TinyColor(this._selectedColor.hex);

      hsl = tinyColor.toHslString();
      hsv = tinyColor.toHsvString();
      rgb = tinyColor.toRgbString();
    }

    return { hsl, hsv, rgb };
  }

  @action
  initColorPicker(element: HTMLElement): void {
    this.onChange = (color): void => {
      if (color) {
        this.setSelectedColor(color.rgba);
      }
    };

    const { selectedColor } = this.args;

    this.setSelectedColor(selectedColor ? selectedColor.hex : '#42445a');
    this._setupColorPicker(element, this._selectedColor.hex);
  }

  @action
  async saveColorAndClose(): Promise<void> {
    const colorToEdit = this.args.selectedColor;

    // If we passed a color to edit, save it, otherwise create a new global color
    if (colorToEdit) {
      // TODO: Consider refactoring to use a single `updateRecord` operation
      // instead of multiple `replaceAttribute` operations.
      await this.store.update((t) =>
        ['r', 'g', 'b', 'a', 'name'].map((attr) =>
          t.replaceAttribute(
            { type: 'color', id: colorToEdit.id },
            attr,
            //@ts-expect-error TODO fix this error later
            this._selectedColor[attr],
          ),
        ),
      );

      this.undoManager.setupUndoRedo();
    } else {
      await this.args.saveColor(this._selectedColor?.hex);
    }

    this.args.toggleIsShown();
  }

  @action
  destroyColorPicker(): void {
    this.colorPicker?.off('color:change', this.onChange);
  }

  @action
  setSelectedColor(color: string): void {
    const tinyColor = new TinyColor(color);
    const { r, g, b, a } = tinyColor.toRgb();
    const namedColor = this.nearestColor.nearest({ r, g, b });
    const hex = rgbaToHex(r, g, b, a);

    this._selectedColor = {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: a,
      hex,
      name: namedColor.name,
      r,
      g,
      b,
      a,
    };
  }

  @action
  updateColor(): void {
    const { r, g, b } = this._selectedColor;
    const namedColor = this.nearestColor.nearest({ r, g, b });

    set(this._selectedColor, 'name', namedColor.name);

    this.colorPicker?.setColors([this._selectedColor].map((c) => c.hex));
  }

  /**
   * Updates the internal, private input values
   * @param {string} key The key to the value to change
   */
  @action
  updateColorInputs(key: keyof PublicRGBAHex, value: number | string): void {
    set(this._selectedColor, `_${key}` as keyof PrivateRGBAHex, value);
  }

  @action
  _setupColorPicker(element: HTMLElement, hex: string): void {
    // TODO: correctly type this instead of using `any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.colorPicker = new (iro.ColorPicker as any)(element, {
      colors: [hex],
      layoutDirection: 'vertical',
      layout: [
        {
          component: iro.ui.Box,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            width: 190,
          },
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            margin: 20,
            sliderSize: 10,
            sliderType: 'hue',
            width: 300,
          },
        },
        {
          component: iro.ui.Slider,
          options: {
            borderColor: 'transparent',
            borderWidth: 0,
            sliderSize: 10,
            sliderType: 'alpha',
            width: 300,
          },
        },
      ],
      width: 207,
    });

    this.colorPicker?.on('color:change', this.onChange);
  }
}
