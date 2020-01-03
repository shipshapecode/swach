import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import fade from 'ember-animated/transitions/fade';
import { action } from '@ember/object';

export default class KulerPaletteRowComponent extends Component {
  @service colorUtils;
  @service router;

  fade = fade;
  showMenu = false;

  @action
  async savePalette() {
    await this.router.transitionTo('palettes');
    await this.args.palette.colors.invoke('save');
    await this.args.palette.save();
  }
}
