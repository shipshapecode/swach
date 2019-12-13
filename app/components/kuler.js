import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import { TinyColor } from '@ctrl/tinycolor';

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];

  @tracked palette;
  @tracked selectedHarmony;

  willDestroy() {
    if (this.palette && this.palette.isNew) {
      this.palette.destroyRecord();
    }
  }

  @action
  async setSelectedHarmony(selectedHarmony) {
    this.selectedHarmony = selectedHarmony;

    if (this.selectedHarmony) {
      if (this.palette && this.palette.isNew) {
        await this.palette.destroyRecord();
      }
      this.palette = await this.store.createRecord('palette', {
        name: capitalize(this.selectedHarmony)
      });

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
