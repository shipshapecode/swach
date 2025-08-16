import { hash } from '@ember/helper';
import { on } from '@ember/modifier';
import { action, set } from '@ember/object';
import Component from '@glimmer/component';
// @ts-expect-error TODO: fix this
import OneWayInputMask from 'ember-inputmask/_app_/components/one-way-input-mask.js';
import type { SelectedColorModel } from './rgb-input';
import { rgbaToHex } from 'swach/data-models/color';

interface AlphaInputSignature {
  Element: HTMLInputElement;
  Args: {
    selectedColor: SelectedColorModel;
    update: (value: string | number) => void;
    updateColor: () => void;
    value?: number;
  };
}

export default class AlphaInputComponent extends Component<AlphaInputSignature> {
  <template>
    <span class="input-prefix">
      A:
    </span>

    <OneWayInputMask
      ...attributes
      maxlength={{4}}
      @mask="9[.9[9]]"
      @options={{hash
        greedy=false
        isComplete=this.isComplete
        min=0
        max=1
        oncomplete=this.onComplete
        onincomplete=this.onIncomplete
        regex=this.alphaRegex
        showMaskOnFocus=false
        showMaskOnHover=false
        unmaskAsNumber=false
      }}
      @update={{@update}}
      @value={{@value}}
      {{on "keypress" this.enterPress}}
    />
  </template>
  alphaRegex = /^[1]$|^[0]$|^(0\.[0-9]{1,2})$/;

  @action
  enterPress(event: KeyboardEvent): void {
    if (event.keyCode === 13) {
      (<HTMLInputElement>event.target).blur();
    }
  }

  @action
  isComplete(buffer: Buffer, opts: { regex: string }): boolean {
    const value = buffer.join('');

    return Boolean(value.length) && new RegExp(opts.regex).test(value);
  }

  /**
   * When the rgb input value passes the regex, set the value, and update the hex values and color.
   * @param {Event} event
   */
  @action
  onComplete(event: InputEvent): void {
    const { selectedColor } = this.args;
    let value = parseFloat((<HTMLInputElement>event.target).value);

    if (value > 1) {
      value = 1;
    }

    set(selectedColor, 'a', value);
    set(selectedColor, `_a`, value);

    const { r, g, b, a } = selectedColor;
    const hex = rgbaToHex(r, g, b, a);

    set(selectedColor, '_hex', hex);
    set(selectedColor, 'hex', hex);
    this.args.updateColor();
  }

  /**
   * Resets the alpha input value if you navigate away
   */
  @action
  onIncomplete(): void {
    set(this.args.selectedColor, `_a`, this.args.selectedColor.a);
  }
}
