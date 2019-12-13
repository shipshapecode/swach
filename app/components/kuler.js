import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { TinyColor } from '@ctrl/tinycolor';

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'triad'];

  @tracked selectedHarmony;

  constructor() {
    super(...arguments);

    this.palette = this.store.createRecord('palette');
  }

  @action
  noop() {}

  @action
  setSelectedHarmony(selectedHarmony) {
    this.selectedHarmony = selectedHarmony;

    if (this.selectedHarmony) {
      this.palette.colors.clear();

      let colors = new TinyColor(this.args.baseColor.hex)[this.selectedHarmony](
        5
      );
      colors = colors.map(color =>
        this.colorUtils.createColorRecord(color.toHexString())
      );

      this.palette.colors.pushObjects(colors);
    }
  }
}
