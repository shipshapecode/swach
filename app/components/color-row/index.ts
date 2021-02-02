import { action } from '@ember/object';
import Router from '@ember/routing/router-service';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import ColorModel from 'swach/data-models/color';
import PaletteModel from 'swach/data-models/palette';
import ColorUtils from 'swach/services/color-utils';

interface ColorRowArgs {
  color: any;
  deleteColor: (color: ColorModel) => void;
  palette: PaletteModel;
  showActions: boolean;
}

export default class ColorRow extends Component<ColorRowArgs> {
  @service colorUtils!: ColorUtils;
  @service router!: Router;

  @tracked deleteConfirm = false;

  get showActions(): boolean {
    if (isEmpty(this.args.showActions)) {
      return true;
    }

    return this.args.showActions;
  }

  @action
  deleteColor(color: ColorModel): void {
    if (!this.args.palette.isLocked) {
      if (this.deleteConfirm) {
        this.args.deleteColor(color);
      }

      this.deleteConfirm = true;
    }
  }

  @action
  transitionToKuler(event: Event): void {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id }
    });
  }
}
