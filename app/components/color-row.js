import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class ColorRow extends Component {
  @service colorUtils;
  @service router;

  showMenu = false;

  @action
  transitionToKuler(event) {
    event.stopPropagation();
    this.router.transitionTo('color-manager.kuler', {
      queryParams: { colorId: this.args.color.id }
    });
  }
}
