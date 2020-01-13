import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';

export default class ColorRow extends Component {
  @service colorUtils;
  @service router;

  @tracked deleteConfirm = false;
  fade = fade;
  showMenu = false;

  get showActions() {
    if (isEmpty(this.args.showActions)) {
      return true;
    }

    return this.args.showActions;
  }

  @action
  deleteColor(color) {
    if (!this.args.palette.isLocked) {
      if (this.deleteConfirm) {
        this.args.deleteColor(color);
      }

      this.deleteConfirm = true;
    }
  }

  @action
  transitionToKuler(event) {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id }
    });
  }
}
