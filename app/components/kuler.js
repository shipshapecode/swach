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
  selectedColorIndex = 0;

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
      const palette = {
        type: 'palette',
        name: capitalize(harmony),
        createdAt: new Date(),
        isColorHistory: false,
        isFavorite: false,
        isLocked: false,
        colors: []
      };

      let colors = new TinyColor(this.baseColor.hex)[harmony](5);
      colors = await Promise.all(
        colors.map(async color => {
          return this.colorUtils.createColorPOJO(color.toHexString());
        })
      );
      colors = colors.map(color => color.attributes);

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
    this.palettes = [];
  }

  @action
  async _onColorChange(color) {
    debugger;
    // TODO if changing a color, and it is not the baseColor, we should update it in the palette

    // TODO if changing the selected baseColor, we should update all the colors
    // this.baseColor = await this.colorUtils.createColorPOJO(color.hexString);
    // this.baseColorChanged();
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
