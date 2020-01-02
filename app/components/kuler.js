import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import { TinyColor } from '@ctrl/tinycolor';
import { fadeOut } from 'ember-animated/motions/opacity';
import move from 'ember-animated/motions/move';

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];
  @tracked palettes = [];

  constructor() {
    super(...arguments);

    this.baseColorChanged();
  }

  @action
  async baseColorChanged() {
    await this._destroyLeftoverPalettes();

    for (const harmony of this.harmonies) {
      const palette = this.store.createRecord('palette', {
        name: capitalize(harmony)
      });

      let colors = new TinyColor(this.args.baseColor.hex)[harmony](5);
      colors = colors.map(color =>
        this.colorUtils.createColorRecord(color.toHexString())
      );

      palette.colors.pushObjects(colors);

      this.palettes.pushObject(palette);
    }
  }

  willDestroy() {
    this._destroyLeftoverPalettes();
  }

  async _destroyLeftoverPalettes() {
    for (const palette of this.palettes) {
      if (palette.isNew) {
        await palette.destroyRecord();
      }
    }

    this.palettes = [];
  }

  *transition({ keptSprites, insertedSprites, removedSprites }) {
    for (let sprite of insertedSprites) {
      sprite.startTranslatedBy(0, -sprite.finalBounds.height / 2);
      move(sprite);
    }

    for (let sprite of keptSprites) {
      move(sprite);
    }

    for (let sprite of removedSprites) {
      fadeOut(sprite);
    }
  }
}
