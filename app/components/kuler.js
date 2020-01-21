import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { capitalize } from '@ember/string';
import { tracked } from '@glimmer/tracking';
import fade from 'ember-animated/transitions/fade';
import { TinyColor } from '@ctrl/tinycolor';
import iro from '@jaames/iro';

iro.ColorPicker.prototype.setColors = function(newColorValues) {
  // Unbind color events
  this.colors.forEach(color => color.unbind());
  // Destroy old colors
  this.colors = [];
  // Add new colors
  newColorValues.forEach(colorValue => this.addColor(colorValue));
  // Reset active color
  this.setActiveColor(0);
};

export default class KulerComponent extends Component {
  @service colorUtils;
  @service store;

  harmonies = ['analogous', 'monochromatic', 'tetrad', 'triad'];
  fade = fade;

  @tracked baseColor;
  @tracked colors = [];
  @tracked palettes = [];
  @tracked selectedPalette;

  constructor() {
    super(...arguments);

    this.baseColor = this.args.baseColor;
    this.baseColorChanged().then(() => {
      this._setupColorWheel();
    });
  }

  @action
  async baseColorChanged() {
    await this._destroyLeftoverPalettes();

    for (const harmony of this.harmonies) {
      const palette = await this.store.addRecord({
        type: 'palette',
        name: capitalize(harmony)
      });

      let colors = new TinyColor(this.baseColor.hex)[harmony](5);
      colors = colors.map(color =>
        this.colorUtils.createColorRecord(color.toHexString())
      );

      palette.colors.pushObjects(colors);

      this.palettes.pushObject(palette);
    }

    this.selectedPalette = this.palettes[0];
  }

  willDestroy() {
    this._destroyLeftoverPalettes();
    this.colorPicker.off('color:change', this._onColorChange);
  }

  @action
  setSelectedPalette(palette) {
    this.selectedPalette = palette;
    this.colorPicker.setColors(this.selectedPalette.colors.mapBy('hex'));
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
      colors: this.selectedPalette.colors.mapBy('hex'),
      width: 200
    });

    this.colorPicker.on('color:change', this._onColorChange);
  }
}
