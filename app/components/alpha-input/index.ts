import { action, set } from '@ember/object';
import Component from '@glimmer/component';

import { SelectedColorModel } from 'swach/components/rgb-input';
import { rgbaToHex } from 'swach/data-models/color';

interface AlphaInputSignature {
  Element: HTMLInputElement;
  Args: {
    selectedColor: SelectedColorModel;
    updateColor: () => void;
  };
}

export default class AlphaInputComponent extends Component<AlphaInputSignature> {
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

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    AlphaInput: typeof AlphaInputComponent;
  }
}
