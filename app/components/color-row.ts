import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';
import ColorUtils from 'swach/services/color-utils';
import Router from '@ember/routing/router-service';

interface ColorRowArgs {
  color: any;
  deleteColor: Function;
  palette: any;
  showActions: boolean;
}

export default class ColorRow extends Component<ColorRowArgs>{
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
  deleteColor(color: any) {
    if (!this.args.palette.isLocked) {
      if (this.deleteConfirm) {
        this.args.deleteColor(color);
      }

      this.deleteConfirm = true;
    }
  }

  @action
  transitionToKuler(event: Event) {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id }
    });
  }
}
