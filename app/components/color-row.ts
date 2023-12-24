import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';

import type Router from '@ember/routing/router-service';
import type ColorModel from 'swach/data-models/color';
import type PaletteModel from 'swach/data-models/palette';
import type ColorUtils from 'swach/services/color-utils';

interface ColorRowSignature {
  Element: HTMLDivElement;
  Args: {
    color: ColorModel;
    deleteColor?: (color: ColorModel) => void;
    palette: PaletteModel;
    showActions: boolean;
    toggleColorPickerIsShown: (color?: ColorModel) => void;
  };
}

export default class ColorRowComponent extends Component<ColorRowSignature> {
  @service declare colorUtils: ColorUtils;
  @service declare router: Router;

  get showActions(): boolean {
    if (isEmpty(this.args.showActions)) {
      return true;
    }

    return this.args.showActions;
  }

  @action
  deleteColor(color: ColorModel): void {
    if (!this.args.palette.isLocked) {
      this.args.deleteColor?.(color);
    }
  }

  @action
  transitionToKuler(event: Event): void {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id },
    });
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    ColorRow: typeof ColorRowComponent;
  }
}
