import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';
import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];
  fade = fade;

  @tracked palettes = [];
  @tracked baseColor;

  constructor() {
    super(...arguments);

    this.baseColor = this.args.baseColor;
    this.baseColorChanged();
  }


  @action
  async baseColorChanged() {
    await this._destroyLeftoverPalettes();

    for (const harmony of this.harmonies) {
      const palette = this.store.createRecord('palette', {
        name: capitalize(harmony)
      });

      let colors = new TinyColor(this.baseColor.hex)[harmony](5);
      colors = colors.map(color =>
        this.colorUtils.createColorRecord(color.toHexString())
      );

      palette.colors.pushObjects(colors);

      this.palettes.pushObject(palette);
    }
  }

  willDestroy() {
    this._destroyLeftoverPalettes();
    this.colorPicker.off('color:change', this._onColorChange);
  }

  @action
  async _destroyLeftoverPalettes() {
    for (const palette of this.palettes) {
      if (palette.isNew) {
        await palette.destroyRecord();
      }
    }

    this.palettes = [];
  }

  @action
  async _onColorChange(color) {
    this.baseColor = await this.colorUtils.createColorRecord(color.hexString);
    this.baseColorChanged();
  }

  @action
  _setupColorWheel() {
    this.colorPicker = new iro.ColorPicker('#color-picker-container', {
      color: this.baseColor.hex,
      width: 200
    });

    this.colorPicker.on('color:change', this._onColorChange);
  }
}
