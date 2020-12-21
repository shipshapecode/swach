import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';
import ColorUtils from 'swach/services/color-utils';
import Router from '@ember/routing/router-service';
import PaletteModel from 'swach/data-models/palette';

interface ColorRowArgs {
  color: any;
  deleteColor: Function;
  palette: PaletteModel;
  showActions: boolean;
}

export default class ColorRow extends Component<ColorRowArgs> {
  @service colorUtils!: ColorUtils;
  @service router!: Router;

  @tracked deleteConfirm = false;
  fade = fade;
  showMenu = false;

  get showActions(): boolean {
    if (isEmpty(this.args.showActions)) {
      return true;
    }

    return this.args.showActions;
  }

  @action
  deleteColor(color: any): void {
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
