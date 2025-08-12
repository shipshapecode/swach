import { hash } from '@ember/helper';
import { on } from '@ember/modifier';
import { action, set, setProperties } from '@ember/object';
import Component from '@glimmer/component';

// @ts-expect-error TODO: fix this
import OneWayInputMask from 'ember-inputmask/_app_/components/one-way-input-mask.js';

import { TinyColor } from '@ctrl/tinycolor';

import type {
  SelectedColorModel,
  SelectedColorPOJO,
} from 'swach/components/rgb-input';
import { rgbaToHex } from 'swach/data-models/color';

interface HexInputSignature {
  Element: HTMLInputElement;
  Args: {
    selectedColor: SelectedColorModel | SelectedColorPOJO;
    update: (value: string | number) => void;
    updateColor: () => void;
    value?: string;
  };
}

export default class HexInputComponent extends Component<HexInputSignature> {
  <template>
    <OneWayInputMask
      ...attributes
      @options={{hash
        isComplete=this.isComplete
        regex=this.hexRegex
        showMaskOnFocus=false
        showMaskOnHover=false
        onincomplete=this.onIncomplete
        oncomplete=this.onComplete
      }}
      @mask="\#*{6,8}"
      @update={{@update}}
      @value={{@value}}
      {{on "keypress" this.enterPress}}
    />
  </template>
  hexRegex = /^#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6})$/;

  @action
  enterPress(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      (<HTMLInputElement>event.target).blur();
    }
  }

  @action
  isComplete(buffer: Buffer, opts: { regex: string }): boolean {
    return new RegExp(opts.regex).test(buffer.join(''));
  }

  /**
   * Executes whenever the hex value matches the regex. We can use this to change the color values only when valid.
   * @param {Event} event The event when the hex matches the regex and is valid
   */
  @action
  onComplete(event: InputEvent): void {
    const tinyColor = new TinyColor((<HTMLInputElement>event.target).value);
    const { r, g, b, a } = tinyColor.toRgb();
    const hex = rgbaToHex(r, g, b, a);
    const alpha = parseFloat(a.toFixed(2));

    setProperties(this.args.selectedColor, {
      _hex: hex,
      _r: r,
      _g: g,
      _b: b,
      _a: alpha,
      hex,
      r,
      g,
      b,
      a: alpha,
    });
    this.args.updateColor();
  }

  /**
   * Resets the hex value if you navigate away
   */
  @action
  onIncomplete(): void {
    set(this.args.selectedColor, '_hex', this.args.selectedColor?.hex);
  }
}
