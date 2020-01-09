import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import fade from 'ember-animated/transitions/fade';

export default class ColorRow extends Component {
  @service colorUtils;
  @service router;

  fade = fade;
  showMenu = false;

  @action
  transitionToKuler(event) {
    event.stopPropagation();
    this.router.transitionTo('kuler', {
      queryParams: { colorId: this.args.color.id }
    });
  }
}
